import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { authenticator } from 'otplib';
import { EncryptingService } from 'src/encrypting/encrypting.service';
import { User, UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class OtpAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly encryptingService: EncryptingService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async generateSecret(email: string) {
    const secret = authenticator.generateSecret();
    const appName = this.configService.getOrThrow('TFA_APP_NAME');
    const uri = authenticator.keyuri(email, appName, secret);

    return { secret, uri };
  }

  async verifyCode(code: string, encryptedSecret: string) {
    const decrypted = await this.encryptingService.decrypt(encryptedSecret);

    return authenticator.verify({ token: code, secret: decrypted });
  }

  async enableTFAForUser(email: string, secret: string) {
    const encrypted = await this.encryptingService.encrypt(secret);

    try {
      await this.userModel.findOneAndUpdate(
        { email },
        { tfaSecret: encrypted, isTFAEnabled: true },
      );
    } catch {
      throw new BadRequestException('No user found');
    }
  }
}
