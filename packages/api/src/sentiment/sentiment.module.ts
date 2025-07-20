import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SentimentService } from './sentiment.service';

@Module({
  imports: [ConfigModule],
  providers: [SentimentService],
  exports: [SentimentService],
})
export class SentimentModule {}
