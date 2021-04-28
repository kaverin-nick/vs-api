import {TokenService} from '@loopback/authentication';
import {
  RefreshTokenServiceBindings,
  TokenObject,
  TokenServiceBindings,
  UserServiceBindings,
} from '@loopback/authentication-jwt';
import {BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {promisify} from 'util';
import {v4 as uuidv4} from 'uuid';
import {MyUserService} from '.';
import {MyRefereshTokenWithRelations} from '../models';
import {MyRefreshTokenRepository} from '../repositories';

const jwt = require('jsonwebtoken');
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

@injectable({scope: BindingScope.TRANSIENT})
export class MyRefreshTokenService {
  constructor(
    @inject(RefreshTokenServiceBindings.REFRESH_SECRET)
    private refreshSecret: string,
    @inject(RefreshTokenServiceBindings.REFRESH_EXPIRES_IN)
    private refreshExpiresIn: string,
    @inject(RefreshTokenServiceBindings.REFRESH_ISSUER)
    private refreshIssure: string,
    @repository(MyRefreshTokenRepository)
    public refreshTokenRepository: MyRefreshTokenRepository,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: MyUserService,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
  ) {}

  async generateToken(
    userProfile: UserProfile,
    token: string,
    userAgent?: string,
  ): Promise<TokenObject> {
    const userId = userProfile[securityId];
    let refreshToken = null;
    // is refresh Token already exists for this user & user-agent
    if (userAgent) {
      const refreshTokenExisting = await this.refreshTokenRepository.findOne({
        where: {
          userId: userId,
          userAgent: userAgent,
        },
      });
      if (refreshTokenExisting) {
        try {
          await verifyAsync(
            refreshTokenExisting.refreshToken,
            this.refreshSecret,
          );
          refreshToken = refreshTokenExisting.refreshToken;
        } catch (e) {
          await this.refreshTokenRepository.deleteAll({
            userId: userId,
            userAgent: userAgent,
            refreshToken: refreshTokenExisting.refreshToken,
          });
        }
      }
    }
    if (!refreshToken) {
      const data = {
        token: uuidv4(),
      };
      refreshToken = await signAsync(data, this.refreshSecret, {
        expiresIn: Number(this.refreshExpiresIn),
        issuer: this.refreshIssure,
      });
      await this.refreshTokenRepository.create({
        userId: userId,
        refreshToken: refreshToken,
        userAgent: userAgent,
      });
    }
    return {
      accessToken: token,
      refreshToken: refreshToken,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenObject> {
    try {
      if (!refreshToken) {
        throw new HttpErrors.Unauthorized(
          `Error verifying token : 'refresh token' is null`,
        );
      }
      const userRefreshData = await this.verifyToken(refreshToken);
      const user = await this.userService.findUserById(
        userRefreshData.userId.toString(),
      );
      const userProfile = this.userService.convertToUserProfile(user);
      const token = await this.jwtService.generateToken(userProfile);
      await this.refreshTokenRepository.updateAll(
        {refreshed: new Date()},
        {refreshToken: refreshToken},
      );
      return {
        accessToken: token,
      };
    } catch (error) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : ${error.message}`,
      );
    }
  }

  async verifyToken(
    refreshToken: string,
  ): Promise<MyRefereshTokenWithRelations> {
    try {
      await verifyAsync(refreshToken, this.refreshSecret);
      const userRefreshData = await this.refreshTokenRepository.findOne({
        where: {refreshToken: refreshToken},
      });

      if (!userRefreshData) {
        throw new HttpErrors.Unauthorized(
          `Error verifying token : Invalid Token`,
        );
      }
      return userRefreshData;
    } catch (error) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : ${error.message}`,
      );
    }
  }
}
