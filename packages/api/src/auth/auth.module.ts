import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthenticationController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [PassportModule.register({ session: true }), ConfigModule],
  providers: [AuthService, GoogleStrategy, PrismaService],
  controllers: [AuthenticationController],
  exports: [AuthService],
})
export class AuthModule {}
