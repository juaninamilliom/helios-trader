import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthenticationController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { SessionSerializer } from './session.serializer';

@Module({
  imports: [
    PassportModule.register({ session: true }),
    ConfigModule,
    PrismaModule,
  ],
  providers: [AuthService, GoogleStrategy, SessionSerializer],
  controllers: [AuthenticationController],
  exports: [AuthService],
})
export class AuthModule {}
