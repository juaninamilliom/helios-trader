import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ensureError } from '../utils/error-handling';

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
}

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private readonly coinGeckoApiBaseUrl = 'https://api.coingecko.com/api/v3';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Fetches the list of trending coins from CoinGecko.
   * @returns A promise that resolves to an array of trending coins.
   */
  async getTrendingCoins(): Promise<TrendingCoin[]> {
    this.logger.log('Fetching trending coins from CoinGecko...');
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.coinGeckoApiBaseUrl}/search/trending`),
      );

      // The actual coins are in a nested 'coins' array, and each coin is in an 'item' object.
      if (response.data && Array.isArray(response.data.coins)) {
        const coins = response.data.coins.map((c: any) => c.item);
        this.logger.log(`Found ${coins.length} trending coins.`);
        return coins;
      }

      throw new Error('Invalid data structure from CoinGecko API');
    } catch (err: unknown) {
      const error = ensureError(err);
      this.logger.error(`Failed to fetch trending coins: ${error.message}`);
      throw new Error(`Could not fetch trending coins: ${error.message}`);
    }
  }
}
