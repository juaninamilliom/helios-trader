import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AlpacaService } from './alpaca.service';
import { AlpacaController } from './alpaca.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [AlpacaService],
  controllers: [AlpacaController],
  exports: [AlpacaService],
})
export class AlpacaModule {}
