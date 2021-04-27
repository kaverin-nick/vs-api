import {
  authenticate,
  TokenService
} from '@loopback/authentication';
import {
  Credentials,
  RefreshTokenService,
  RefreshTokenServiceBindings,
  TokenObject,
  TokenServiceBindings,
  UserServiceBindings
} from '@loopback/authentication-jwt';
import {inject} from '@loopback/core';
import {
  get,
  getModelSchemaRef,
  HttpErrors,
  post,
  requestBody
} from '@loopback/rest';
import {
  SecurityBindings,
  securityId,
  UserProfile
} from '@loopback/security';
import {genSalt, hash} from 'bcryptjs';
import {
  MyUser,
  MyUserCredentials,
  MyUserTokens, MY_USER_HIDDEN_FIELDS
} from '../models';
import {MyUserRepository} from '../repositories';
import {MyUserService} from '../services';

export class UserController {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: MyUserService,
    @inject(SecurityBindings.USER, {optional: true})
    private userProfile: UserProfile,
    @inject(UserServiceBindings.USER_REPOSITORY)
    public userRepository: MyUserRepository,
    @inject(RefreshTokenServiceBindings.REFRESH_TOKEN_SERVICE)
    public refreshService: RefreshTokenService,
  ) { }

  @post('/users/signup', {
    responses: {
      '200': {
        description: 'MyUser model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(MyUser, {
              includeRelations: false,
              exclude: MY_USER_HIDDEN_FIELDS
            }),
          },
        },
      },
    },
  })
  async signUp(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MyUserCredentials, {
            includeRelations: false
          }),
        },
      },
    })
    newUserRequest: MyUserCredentials,
  ): Promise<MyUser> {
    const password = await hash(newUserRequest.password, await genSalt());
    delete (newUserRequest as Partial<MyUserCredentials>).password;
    const savedUser = await this.userRepository.create(newUserRequest);

    await this.userRepository.userCredentials(savedUser.id).create({password});

    return savedUser;
  }

  @post('/users/login', {
    responses: {
      '200': {
        description: 'MyUserTokens model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(MyUserTokens, {includeRelations: false}),
          },
        },
      },
    },
  })
  async login(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MyUserCredentials, {
            title: 'Credentials'
          }),
        },
      },
    }) credentials: Credentials,
  ): Promise<TokenObject> {
    // ensure the user exists, and the password is correct
    const user = await this.userService.verifyCredentials(credentials);
    // convert a User object into a UserProfile object (reduced set of properties)
    const userProfile: UserProfile = this.userService.convertToUserProfile(
      user,
    );
    const accessToken = await this.jwtService.generateToken(userProfile);
    const tokens = await this.refreshService.generateToken(
      userProfile,
      accessToken,
    );
    return tokens;
  }

  @post('/users/refresh', {
    responses: {
      '200': {
        description: 'MyUserTokens model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(MyUserTokens, {
              includeRelations: false,
              title: 'AccessToken',
              exclude: ['refreshToken', 'expiresIn']
            }),
          },
        },
      },
    },
  })
  async refresh(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MyUserTokens, {
            title: 'RefreshToken',
            exclude: ['accessToken', 'expiresIn']
          }),
        },
      },
    }) refreshToken: MyUserTokens,
  ): Promise<TokenObject> {
    const invalidRefreshTokenError = 'Invalid Refresh Token';
    if (refreshToken.refreshToken)
      return this.refreshService.refreshToken(refreshToken.refreshToken);
    else
      throw new HttpErrors.Unauthorized(invalidRefreshTokenError);
  }

  @authenticate('jwt')
  @get('/users/me', {
    responses: {
      '200': {
        description: 'MyUser model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(MyUser, {
              includeRelations: false,
              exclude: MY_USER_HIDDEN_FIELDS
            }),
          },
        },
      },
    },
  })
  async me(): Promise<MyUser> {
    return await this.userService.userRepository.findById(
      this.userProfile[securityId]
    );
  }

}
