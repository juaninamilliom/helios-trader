import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AlpacaModule } from '../alpaca/alpaca.module';

@Module({
  imports: [ConfigModule, AlpacaModule],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
