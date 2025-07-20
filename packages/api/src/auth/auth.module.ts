import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthenticationController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PassportModule.register({ session: true }),
    ConfigModule,
    PrismaModule,
  ],
  providers: [AuthService, GoogleStrategy],
  controllers: [AuthenticationController],
  exports: [AuthService],
})
export class AuthModule {}
