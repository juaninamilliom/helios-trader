import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ensureError } from '../utils/error-handling';

/**
 * Represents a sentiment analysis result for a cryptocurrency
 */
export interface SentimentResult {
  symbol: string;
  name: string;
  score: number; // Range from -1 (very negative) to 1 (very positive)
  volume: number; // Relative volume of mentions
  sources: {
    twitter: number; // Twitter/X sentiment score
    reddit: number; // Reddit sentiment score
    news: number; // News sentiment score
  };
  trending: boolean; // Whether the coin is currently trending
  timestamp: Date;
}

/**
 * Service for analyzing social media sentiment around cryptocurrencies
 */
@Injectable()
export class SentimentService {
  private readonly logger = new Logger(SentimentService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Get sentiment analysis for a specific cryptocurrency
   * @param symbol The cryptocurrency symbol (e.g., 'BTC', 'PEPE')
   * @returns Promise resolving to sentiment analysis results
   */
  async getSentiment(symbol: string): Promise<SentimentResult> {
    this.logger.log(`Getting sentiment for ${symbol}`);

    try {
      // TODO: Integrate with actual sentiment analysis API
      // For now, return mock data
      return this.getMockSentiment(symbol);
    } catch (err: unknown) {
      const error = ensureError(err);
      this.logger.error(
        `Error getting sentiment for ${symbol}: ${error.message}`,
      );
      throw new Error(`Failed to get sentiment data: ${error.message}`);
    }
  }

  /**
   * Get sentiment analysis for multiple cryptocurrencies
   * @param symbols Array of cryptocurrency symbols
   * @returns Promise resolving to an array of sentiment analysis results
   */
  async getBatchSentiment(symbols: string[]): Promise<SentimentResult[]> {
    this.logger.log(
      `Getting sentiment for multiple coins: ${symbols.join(', ')}`,
    );

    try {
      // Process each symbol and collect results
      const results = await Promise.all(
        symbols.map((symbol) => this.getSentiment(symbol)),
      );

      return results;
    } catch (err: unknown) {
      const error = ensureError(err);
      this.logger.error(`Error in batch sentiment analysis: ${error.message}`);
      throw new Error(`Failed to get batch sentiment data: ${error.message}`);
    }
  }

  /**
   * Generate mock sentiment data for development/testing
   * @param symbol Cryptocurrency symbol
   * @returns Mock sentiment result
   * @private
   */
  private getMockSentiment(symbol: string): SentimentResult {
    // Generate pseudo-random but deterministic values based on the symbol
    const hash = this.simpleHash(symbol);

    // Generate a sentiment score between -1 and 1
    const sentimentBase = (hash % 100) / 100;
    const sentiment = sentimentBase * 2 - 1;

    // Generate volume between 1 and 100
    const volume = (hash % 100) + 1;

    // Generate source-specific sentiment scores
    const twitterSentiment = Math.min(Math.max(sentiment + 0.2, -1), 1);
    const redditSentiment = Math.min(Math.max(sentiment - 0.1, -1), 1);
    const newsSentiment = Math.min(Math.max(sentiment + 0.1, -1), 1);

    return {
      symbol,
      name: this.getFullName(symbol),
      score: sentiment,
      volume,
      sources: {
        twitter: twitterSentiment,
        reddit: redditSentiment,
        news: newsSentiment,
      },
      trending: volume > 70, // Consider trending if volume is high
      timestamp: new Date(),
    };
  }

  /**
   * Simple hash function for generating deterministic mock data
   * @param str String to hash
   * @returns Numeric hash value
   * @private
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get full name for a cryptocurrency symbol
   * @param symbol Cryptocurrency symbol
   * @returns Full name
   * @private
   */
  private getFullName(symbol: string): string {
    const nameMap: Record<string, string> = {
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      SOL: 'Solana',
      DOGE: 'Dogecoin',
      SHIB: 'Shiba Inu',
      PEPE: 'Pepe',
      FLOKI: 'Floki Inu',
      BONK: 'Bonk',
      WIF: 'Dogwifhat',
      TURBO: 'Turbo',
    };

    return nameMap[symbol] || `${symbol} Token`;
  }
}
