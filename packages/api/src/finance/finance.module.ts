import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { FinanceDatabase } from './database';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { PlaidProvider, TokenVault, CategoryInference } from './providers';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.finance.local', '.env'],
    }),
    AuthModule,
  ],
  controllers: [FinanceController],
  providers: [
    FinanceDatabase,
    FinanceService,
    PlaidProvider,
    TokenVault,
    CategoryInference,
  ],
})
export class FinanceModule {}
