import {
  authenticate,
  TokenService
} from '@loopback/authentication';
import {
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
  requestBody,
  RequestContext,
  RestBindings
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
  MyUserTokens,
  MY_USER_HIDDEN_FIELDS
} from '../models';
import {
  MyRefreshTokenRepository,
  MyUserRepository
} from '../repositories';
import {
  MyRefreshTokenService,
  MyUserService
} from '../services';

const RefreshTokenSchema = getModelSchemaRef(MyUserTokens, {
  title: 'RefreshToken',
  exclude: ['accessToken', 'expiresIn']
})

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
    public refreshService: MyRefreshTokenService,
    @inject(RefreshTokenServiceBindings.REFRESH_REPOSITORY)
    public refreshTokenRepository: MyRefreshTokenRepository,
    @inject(RestBindings.Http.CONTEXT)
    public context: RequestContext
  ) { }

  getUserAgent(): string | undefined {
    let userAgent = undefined;
    try {
      userAgent = this.context.request.headers['user-agent'];
    }
    catch (e) {
      userAgent = undefined;
    }
    return userAgent;
  }

  @post('/users/signup', {
    responses: {
      '200': {
        description: 'MyUser model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(MyUser, {
              includeRelations: false,
              title: 'MyUserSafe',
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
    let savedUser;
    let err;
    try {
      savedUser = await this.userRepository.create(newUserRequest);
      await this.userRepository.userCredentials(savedUser.id).create({password});
    }
    catch (e) {
      savedUser = null;
      err = e;
    }
    if (savedUser)
      return savedUser;
    else
      throw new HttpErrors.Conflict(err);
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
          schema: getModelSchemaRef(MyUserCredentials),
        },
      },
    }) credentials: MyUserCredentials,
  ): Promise<TokenObject> {
    const user = await this.userService.verifyCredentials(credentials);
    const userProfile = this.userService.convertToUserProfile(user);
    const accessToken = await this.jwtService.generateToken(userProfile);
    const userAgent = this.getUserAgent();
    return this.refreshService.generateToken(userProfile, accessToken, userAgent);
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
          schema: RefreshTokenSchema
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
              title: 'MyUserSafe',
              exclude: MY_USER_HIDDEN_FIELDS
            }),
          },
        },
      },
    },
  })
  async me(): Promise<MyUser> {
    return this.userService.findUserById(this.userProfile[securityId]);
  }

  @authenticate('jwt')
  @post('/users/logout', {
    responses: {
      '200': {
        description: 'Logout result',
        content: {
          'application/json': {
            schema: {},
          },
        },
      },
    },
  })
  async logout(
    @requestBody({
      content: {
        'application/json': {
          schema: RefreshTokenSchema
        },
      },
    }) refreshToken: MyUserTokens,
  ): Promise<void> {
    if (refreshToken.refreshToken) {
      await this.refreshTokenRepository.deleteAll({
        userId: this.userProfile[securityId],
        refreshToken: refreshToken.refreshToken
      });
    }
    else {
      const userAgent = this.getUserAgent();
      if (userAgent) {
        await this.refreshTokenRepository.deleteAll({
          userId: this.userProfile[securityId],
          userAgent: userAgent
        });
      }
    }
  }

}
