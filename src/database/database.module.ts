import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('DB_URI') +
          configService.get<string>('DB_NAME'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
