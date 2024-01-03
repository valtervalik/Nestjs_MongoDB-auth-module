import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { EncryptingModule } from 'src/encrypting/encrypting.module';
import { HashingModule } from 'src/hashing/hashing.module';
import { ApiKey, ApiKeySchema } from 'src/users/schemas/api-key.schema';
import {
  Permission,
  PermissionSchema,
} from 'src/users/schemas/permission.schema';
import { Role, RoleSchema } from 'src/users/schemas/role.schema';
import { User, UserDocument, UserSchema } from 'src/users/schemas/user.schema';
import { HashingService } from '../hashing/hashing.service';
import { ApiKeysService } from './authentication/api-keys.service';
import { AuthenticationController } from './authentication/authentication.controller';
import { AuthenticationService } from './authentication/authentication.service';
import { AccessTokenGuard } from './authentication/guards/access-token.guard';
import { ApiKeyGuard } from './authentication/guards/api-key.guard';
import { AuthGuard } from './authentication/guards/auth.guard';
import { OtpAuthService } from './authentication/otp-auth.service';
import { RefreshTokenIdsStorage } from './authentication/refresh-token-ids.storage/refresh-token-ids.storage';
import { GoogleAuthController } from './authentication/social/google-auth.controller';
import { GoogleAuthService } from './authentication/social/google-auth.service';
import { PermissionsGuard } from './authorization/guards/permissions.guard';
import { PoliciesGuard } from './authorization/guards/policies.guard';
import { RolesGuard } from './authorization/guards/roles.guard';
import { FrameworkContributorPolicyHandler } from './authorization/policies/framework-contributor.policy';
import { PolicyHandlerStorage } from './authorization/policies/policy-handlers.storage';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: User.name,
        useFactory: (hashingService: HashingService) => {
          const schema = UserSchema;

          schema.pre<UserDocument>('save', async function () {
            const doc = this;
            if (doc) {
              doc.password = await hashingService.hash(doc.password);
            }
          });
          return schema;
        },
        imports: [HashingModule],
        inject: [HashingService],
      },
      { name: Role.name, useFactory: () => RoleSchema },
      { name: Permission.name, useFactory: () => PermissionSchema },
      { name: ApiKey.name, useFactory: () => ApiKeySchema },
    ]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    HashingModule,
    EncryptingModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: PoliciesGuard },
    AccessTokenGuard,
    ApiKeyGuard,
    RefreshTokenIdsStorage,
    AuthenticationService,
    PolicyHandlerStorage,
    FrameworkContributorPolicyHandler,
    ApiKeysService,
    OtpAuthService,
    GoogleAuthService,
  ],
  controllers: [AuthenticationController, GoogleAuthController],
})
export class AuthModule {}
