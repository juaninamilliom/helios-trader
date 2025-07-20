import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ensureError } from '../utils/error-handling';

/**
 * Interface representing on-chain risk assessment for a cryptocurrency
 */
export interface RiskAssessment {
  symbol: string;
  name: string;
  contractAddress?: string;
  blockchain: string;
  riskScore: number; // 0-100, higher means riskier
  liquidity: {
    score: number; // 0-100, higher is better
    usdValue: number; // Liquidity in USD
    warning?: string;
  };
  holders: {
    count: number;
    topTenPercentage: number; // Percentage held by top 10 wallets
    warning?: string;
  };
  contract: {
    verified: boolean;
    mintable: boolean;
    renounced: boolean;
    honeypotRisk: number; // 0-100, higher means higher risk
    rugPullRisk: number; // 0-100, higher means higher risk
    warning?: string;
  };
  age: {
    createdAt: Date;
    isNew: boolean; // Less than 7 days old
  };
  recommendation: 'safe' | 'moderate' | 'high_risk' | 'avoid';
  timestamp: Date;
}

/**
 * Service for assessing on-chain risks of cryptocurrencies
 */
@Injectable()
export class RiskService {
  private readonly logger = new Logger(RiskService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Assess the on-chain risk of a cryptocurrency
   * @param symbol The cryptocurrency symbol
   * @param contractAddress Optional contract address for the token
   * @param blockchain Blockchain the token is on (e.g., 'ethereum', 'solana')
   * @returns Promise resolving to risk assessment data
   */
  assessRisk(
    symbol: string,
    contractAddress?: string,
    blockchain: string = 'ethereum',
  ): Promise<RiskAssessment> {
    this.logger.log(`Assessing risk for ${symbol} on ${blockchain}`);

    try {
      // TODO: Integrate with actual blockchain analysis APIs
      // For now, return mock data
      return Promise.resolve(
        this.getMockRiskAssessment(symbol, contractAddress, blockchain),
      );
    } catch (err: unknown) {
      const error = ensureError(err);
      this.logger.error(`Error assessing risk for ${symbol}: ${error.message}`);
      throw new Error(`Failed to assess risk: ${error.message}`);
    }
  }

  /**
   * Assess risks for multiple cryptocurrencies
   * @param tokens Array of tokens to assess
   * @returns Promise resolving to array of risk assessments
   */
  async batchAssessRisk(
    tokens: Array<{
      symbol: string;
      contractAddress?: string;
      blockchain?: string;
    }>,
  ): Promise<RiskAssessment[]> {
    this.logger.log(`Batch risk assessment for ${tokens.length} tokens`);

    try {
      const assessments = await Promise.all(
        tokens.map((token) =>
          this.assessRisk(
            token.symbol,
            token.contractAddress,
            token.blockchain || 'ethereum',
          ),
        ),
      );

      return assessments;
    } catch (err: unknown) {
      const error = ensureError(err);
      this.logger.error(`Error in batch risk assessment: ${error.message}`);
      throw new Error(
        `Failed to perform batch risk assessment: ${error.message}`,
      );
    }
  }

  /**
   * Generate mock risk assessment data for development/testing
   * @param symbol Cryptocurrency symbol
   * @param contractAddress Optional contract address
   * @param blockchain Blockchain name
   * @returns Mock risk assessment
   * @private
   */
  private getMockRiskAssessment(
    symbol: string,
    contractAddress?: string,
    blockchain: string = 'ethereum',
  ): RiskAssessment {
    // Generate deterministic but pseudo-random values based on the symbol
    const hash = this.simpleHash(symbol);

    // Generate risk score between 0 and 100
    const riskScore = hash % 101;

    // Generate liquidity data
    const liquidityScore = Math.max(0, 100 - riskScore / 2);
    const liquidityUsd = 10000 + (hash % 1000000);

    // Generate holder data
    const holderCount = 100 + (hash % 10000);
    const topTenPercentage = 10 + (hash % 91);

    // Generate contract risk data
    const verified = hash % 100 > 20;
    const mintable = hash % 100 > 50;
    const renounced = hash % 100 > 70;
    const honeypotRisk = hash % 101;
    const rugPullRisk = hash % 101;

    // Generate age data
    const daysOld = hash % 365;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysOld);

    // Determine recommendation based on risk factors
    let recommendation: 'safe' | 'moderate' | 'high_risk' | 'avoid';
    if (riskScore < 25) {
      recommendation = 'safe';
    } else if (riskScore < 50) {
      recommendation = 'moderate';
    } else if (riskScore < 75) {
      recommendation = 'high_risk';
    } else {
      recommendation = 'avoid';
    }

    return {
      symbol,
      name: this.getFullName(symbol),
      contractAddress,
      blockchain,
      riskScore,
      liquidity: {
        score: liquidityScore,
        usdValue: liquidityUsd,
        warning:
          liquidityScore < 30
            ? 'Low liquidity, high slippage expected'
            : undefined,
      },
      holders: {
        count: holderCount,
        topTenPercentage,
        warning:
          topTenPercentage > 80
            ? 'High concentration of tokens in top wallets'
            : undefined,
      },
      contract: {
        verified,
        mintable,
        renounced,
        honeypotRisk,
        rugPullRisk,
        warning: !verified
          ? 'Contract not verified, proceed with caution'
          : undefined,
      },
      age: {
        createdAt,
        isNew: daysOld < 7,
      },
      recommendation,
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
