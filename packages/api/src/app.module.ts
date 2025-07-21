import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AlpacaModule } from './alpaca/alpaca.module';
import { AgentModule } from './agent/agent.module';
import { AuthModule } from './auth/auth.module';
import { AuthenticationController } from './auth/auth.controller';
import { MarketDataModule } from './market-data/market-data.module';
import { SentimentModule } from './sentiment/sentiment.module';
import { RiskModule } from './risk/risk.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AlpacaModule,
    AgentModule,
    AuthModule,
    MarketDataModule,
    SentimentModule,
    RiskModule,
  ],
  controllers: [AppController, AuthenticationController],
  providers: [AppService],
})
export class AppModule {}
