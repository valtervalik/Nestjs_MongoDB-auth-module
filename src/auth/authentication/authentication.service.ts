import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import { BaseService } from 'src/base/base.service';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { HashingService } from '../../hashing/hashing.service';
import jwtConfig from '../config/jwt.config';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import { SignInDto } from './dto/sign-in.dto';
import { OtpAuthService } from './otp-auth.service';
import {
  InvalidateRefreshTokenError,
  RefreshTokenIdsStorage,
} from './refresh-token-ids.storage/refresh-token-ids.storage';

@Injectable()
export class AuthenticationService extends BaseService<UserDocument>(
  User.name,
) {
  constructor(
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly refreshTokenIdsStorage: RefreshTokenIdsStorage,
    private readonly otpAuthService: OtpAuthService,
  ) {
    super();
  }

  async signIn(signInDto: SignInDto, response: Response) {
    const user = await this.model
      .findOne({ email: signInDto.email })
      .populate('role')
      .populate('permission')
      .select('+password');

    if (!user) {
      throw new UnauthorizedException('User does not exists');
    }

    if (!user.password) {
      if (user.googleId) {
        throw new UnauthorizedException('Please login with google');
      }
      throw new UnauthorizedException();
    }

    const isEqual = await this.hashingService.compare(
      signInDto.password,
      user.password,
    );

    if (!isEqual) {
      throw new UnauthorizedException('Password does not match');
    }

    if (
      user.isTFAEnabled &&
      !this.otpAuthService.verifyCode(signInDto.tfaCode, user.tfaSecret)
    ) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    return await this.generateTokens(user, response);
  }

  async refreshToken(refreshToken: string, response: Response) {
    try {
      const { sub, refreshTokenId } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'> & { refreshTokenId: string }
      >(refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });

      const user = await this.model
        .findById(sub)
        .populate('role')
        .populate('permission');

      const isValid = await this.refreshTokenIdsStorage.validate(
        user.id,
        refreshTokenId,
      );

      if (isValid) {
        await this.refreshTokenIdsStorage.invalidate(user._id.toString());
      } else {
        throw new Error('Refresh token is invalid');
      }

      return await this.generateTokens(user, response);
    } catch (e) {
      if (e instanceof InvalidateRefreshTokenError) {
        //TODO: notify the user that his refresh token might have been stolen
        throw new UnauthorizedException('Access denied');
      }

      throw new UnauthorizedException();
    }
  }

  private async signToken<T>(userId: string, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );
  }

  async generateTokens(user: User, response: Response) {
    const refreshTokenId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user._id,
        this.jwtConfiguration.accessTokenTTL,
        { email: user.email, role: user.role, permission: user.permission },
      ),
      this.signToken(user._id, this.jwtConfiguration.refreshTokenTTL, {
        refreshTokenId,
      }),
    ]);
    await this.refreshTokenIdsStorage.insert(user._id, refreshTokenId);

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      path: '/auth/refresh-token',
      maxAge: this.jwtConfiguration.refreshTokenTTL * 1000,
      secure: true,
    });
    return { accessToken };
  }
}
