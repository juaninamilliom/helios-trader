/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Alpaca from '@alpacahq/alpaca-trade-api';
import { PrismaService } from '../prisma/prisma.service';
import { ensureError } from '../utils/error-handling';

// Define interfaces for Alpaca API responses to ensure type safety
export interface Account {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  buying_power: string;
  regt_buying_power: string;
  daytrading_buying_power: string;
  cash: string;
  portfolio_value: string;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  transfers_blocked: boolean;
  account_blocked: boolean;
  created_at: string;
  trade_suspended_by_user: boolean;
  multiplier: string;
  shorting_enabled: boolean;
  equity: string;
  last_equity: string;
  long_market_value: string;
  short_market_value: string;
  initial_margin: string;
  maintenance_margin: string;
  last_maintenance_margin: string;
  sma: string;
  daytrade_count: number;
  [key: string]: any; // Allow for other properties from Alpaca
}

/**
 * Type guard for the Account interface.
 * @param obj The object to check.
 * @returns True if the object is an Account, false otherwise.
 */
function isAccount(obj: unknown): obj is Account {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  const account = obj as Record<string, unknown>;
  return (
    typeof account.id === 'string' &&
    typeof account.status === 'string' &&
    typeof account.currency === 'string' &&
    typeof account.buying_power === 'string' &&
    typeof account.equity === 'string' &&
    typeof account.portfolio_value === 'string'
  );
}

export interface Position {
  asset_id: string;
  symbol: string;
  qty: string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  [key: string]: any; // Allow for other properties from Alpaca
}

/**
 * Type guard for the Position interface.
 * @param obj The object to check.
 * @returns True if the object is a Position, false otherwise.
 */
function isPosition(obj: unknown): obj is Position {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  const position = obj as Record<string, unknown>;
  return (
    typeof position.asset_id === 'string' &&
    typeof position.symbol === 'string' &&
    typeof position.qty === 'string'
  );
}

/**
 * Helper to check for Alpaca-specific API errors.
 * @param error The error to check.
 * @returns True if the error is an Alpaca API error, false otherwise.
 */
function isAlpacaApiError(
  error: unknown,
): error is { statusCode: number; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof (error as { statusCode: unknown }).statusCode === 'number' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Service for interacting with the Alpaca API.
 * Handles fetching account info, positions, and other trading-related data.
 */
@Injectable()
export class AlpacaService implements OnModuleInit {
  private readonly logger = new Logger(AlpacaService.name);
  private alpaca: Alpaca;

  /**
   * Creates an instance of AlpacaService.
   * @param configService - Service for accessing environment variables.
   * @param prisma - Service for database interactions.
   */
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // Ensure configService exists before calling methods on it
    if (!this.configService) {
      throw new Error('ConfigService is not available');
    }
    // Use non-null assertion to inform TypeScript that configService is not null
    const apiKey = this.configService.get<string>('ALPACA_API_KEY');
    const secretKey = this.configService.get<string>('ALPACA_SECRET_KEY');

    if (!apiKey || !secretKey) {
      throw new Error(
        'Alpaca API credentials are missing. Please check your environment variables.',
      );
    }

    this.alpaca = new Alpaca({
      keyId: apiKey,
      secretKey: secretKey,
      paper: true, // Use paper trading environment
      baseUrl: 'https://paper-api.alpaca.markets',
      dataBaseUrl: 'https://data.alpaca.markets',
    });
  }

  /**
   * Lifecycle hook that runs when the module is initialized.
   * Verifies connection to Alpaca and logs account information.
   */
  async onModuleInit() {
    this.logger.log('Initializing Alpaca service...');
    try {
      const account = await this.getAccountInfo();
      this.logger.log(
        `Successfully connected to Alpaca. Account ID: ${account.id}`,
      );
    } catch (err: unknown) {
      const error = ensureError(err);
      this.logger.error(`Error initializing Alpaca service: ${error.message}`);
    }
  }

  /**
   * Fetches account information from Alpaca.
   * @returns A promise that resolves to the account information.
   */
  async getAccountInfo(): Promise<Account> {
    this.logger.log('Fetching Alpaca account info...');
    try {
      const accountUnknown: unknown = await this.alpaca.getAccount();
      if (isAccount(accountUnknown)) {
        const account = accountUnknown;
        return account;
      }
      throw new Error('Received invalid account data from Alpaca.');
    } catch (err: unknown) {
      const error = ensureError(err);
      this.logger.error(`Failed to get account info: ${error.message}`);
      throw new Error(`Alpaca API Error: ${error.message}`);
    }
  }

  /**
   * Fetches all positions from Alpaca.
   * @returns A promise that resolves to an array of positions.
   */
  async getPositions(): Promise<Position[]> {
    this.logger.log('Fetching positions...');
    try {
      const positionsUnknown: unknown = await this.alpaca.getPositions();
      if (
        Array.isArray(positionsUnknown) &&
        positionsUnknown.every(isPosition)
      ) {
        const positions = positionsUnknown;
        return positions;
      }
      throw new Error('Received invalid positions data from Alpaca.');
    } catch (err: unknown) {
      const error = ensureError(err);
      this.logger.error(`Failed to get positions: ${error.message}`);
      throw new Error(`Alpaca API Error: ${error.message}`);
    }
  }

  /**
   * Fetches a specific position by its symbol from Alpaca.
   * @param symbol - The stock symbol of the position to fetch.
   * @returns A promise that resolves to the position, or null if not found.
   */
  async getPosition(symbol: string): Promise<Position | null> {
    this.logger.log(`Fetching position for symbol: ${symbol}...`);
    try {
      const positionUnknown: unknown = await this.alpaca.getPosition(symbol);
      if (isPosition(positionUnknown)) {
        const position = positionUnknown;
        return position;
      }
      // If the API returns something but it's not a valid position, treat as not found
      this.logger.warn(`Invalid position data received for symbol: ${symbol}`);
      return null;
    } catch (err: unknown) {
      // Check if the error indicates that the position was not found (404).
      if (isAlpacaApiError(err) && err.statusCode === 404) {
        this.logger.log(`No position found for symbol: ${symbol}`);
        return null;
      }
      const error = ensureError(err);
      this.logger.error(
        `Error fetching position for ${symbol}: ${error.message}`,
      );
      throw new Error(
        `Could not fetch position for ${symbol} from Alpaca: ${error.message}`,
      );
    }
  }
}
