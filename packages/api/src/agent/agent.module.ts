import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AlpacaModule } from '../alpaca/alpaca.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { SentimentModule } from '../sentiment/sentiment.module';
import { RiskModule } from '../risk/risk.module';

@Module({
  imports: [
    ConfigModule,
    AlpacaModule,
    MarketDataModule,
    SentimentModule,
    RiskModule,
  ],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
