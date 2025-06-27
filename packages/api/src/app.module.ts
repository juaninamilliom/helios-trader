import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AlpacaModule } from './alpaca/alpaca.module';
import { AgentModule } from './agent/agent.module';
import { AuthModule } from './auth/auth.module';
import { AuthenticationController } from './auth/auth.controller';

@Module({
  imports: [PrismaModule, AlpacaModule, AgentModule, AuthModule],
  controllers: [AppController, AuthenticationController],
  providers: [AppService],
})
export class AppModule {}
