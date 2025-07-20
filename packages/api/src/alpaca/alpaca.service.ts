/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Disable ESLint for the require import since this is the recommended way to use the Alpaca API
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const Alpaca = require('@alpacahq/alpaca-trade-api');

// Define a type for the Alpaca client instance
interface AlpacaClient {
  getAccount(): Promise<unknown>;
  getPositions(): Promise<unknown>;
  getPosition(symbol: string): Promise<unknown>;
  createOrder(params: unknown): Promise<unknown>;
  getOrder(orderId: string): Promise<unknown>;
  cancelOrder(orderId: string): Promise<unknown>;
  // Add other methods as needed
}
import { PrismaService } from '../prisma/prisma.service';
import { ensureError } from '../utils/error-handling';

// Define interfaces for Alpaca API responses to ensure type safety

// Order types supported by Alpaca
export type OrderType = 'market' | 'limit' | 'stop_limit';

// Time in force options
export type TimeInForce = 'gtc' | 'ioc';

// Order side (buy or sell)
export type OrderSide = 'buy' | 'sell';

// Order status
export type OrderStatus =
  | 'new'
  | 'partially_filled'
  | 'filled'
  | 'done_for_day'
  | 'canceled'
  | 'expired'
  | 'replaced'
  | 'pending_cancel'
  | 'pending_replace'
  | 'rejected'
  | 'suspended'
  | 'pending_new'
  | 'accepted'
  | 'pending_review'
  | 'stopped'
  | 'untriggered';

// Interface for order parameters
export interface OrderParams {
  symbol: string; // Format: 'BTC/USD', 'ETH/USD', etc.
  qty?: string; // Quantity in base currency (e.g., '0.01' BTC)
  notional?: string; // Alternative to qty, order value in quote currency (e.g., '500' USD)
  side: OrderSide;
  type: OrderType;
  time_in_force: TimeInForce;
  limit_price?: string; // Required for limit and stop_limit orders
  stop_price?: string; // Required for stop_limit orders
  client_order_id?: string; // Optional client-specified ID
}

// Interface for order response
export interface Order {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at: string | null;
  expired_at: string | null;
  canceled_at: string | null;
  failed_at: string | null;
  replaced_at: string | null;
  replaced_by: string | null;
  replaces: string | null;
  asset_id: string;
  symbol: string;
  asset_class: string;
  qty: string;
  filled_qty: string;
  type: OrderType;
  side: OrderSide;
  time_in_force: TimeInForce;
  limit_price: string | null;
  stop_price: string | null;
  filled_avg_price: string | null;
  status: OrderStatus;
  extended_hours: boolean;
  legs: Order[] | null;
  trail_percent: string | null;
  trail_price: string | null;
  hwm: string | null;
  [key: string]: any; // Allow for other properties from Alpaca
}

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
 * Type guard for the Order interface.
 * @param obj The object to check.
 * @returns True if the object is an Order, false otherwise.
 */
function isOrder(obj: unknown): obj is Order {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  const order = obj as Record<string, unknown>;
  return (
    typeof order.id === 'string' &&
    typeof order.symbol === 'string' &&
    typeof order.side === 'string' &&
    typeof order.type === 'string' &&
    typeof order.status === 'string'
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
  private alpaca: AlpacaClient;
  private mockMode: boolean;

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

    // Check if mock mode is enabled
    this.mockMode = this.configService.get<string>('MOCK_TRADING') === 'true';
    this.logger.log(
      `AlpacaService initialized with mock mode: ${this.mockMode ? 'ENABLED' : 'DISABLED'}`,
    );

    // Use non-null assertion to inform TypeScript that configService is not null
    const apiKey = this.configService.get<string>('ALPACA_API_KEY')!;
    const secretKey = this.configService.get<string>('ALPACA_SECRET_KEY')!;

    if (!apiKey || !secretKey) {
      throw new Error(
        'Alpaca API credentials are missing. Please check your environment variables.',
      );
    }

    // Create a new instance of the Alpaca client
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.alpaca = new Alpaca({
      keyId: apiKey,
      secretKey: secretKey,
      paper: true, // Use paper trading environment
      baseUrl: 'https://paper-api.alpaca.markets',
      dataBaseUrl: 'https://data.alpaca.markets',
    });

    if (this.mockMode) {
      this.logger.warn('MOCK MODE ENABLED: No real trades will be executed');
    }
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
   * Creates a mock order response for testing purposes.
   * @param params - The order parameters used to generate the mock response.
   * @returns A mock Order object.
   */
  private createMockOrder(params: OrderParams): Order {
    const now = new Date().toISOString();
    const mockOrderId = `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create a mock order response based on the input parameters
    const mockOrder: Order = {
      id: mockOrderId,
      client_order_id: params.client_order_id || `mock-client-${mockOrderId}`,
      created_at: now,
      updated_at: now,
      submitted_at: now,
      filled_at: null,
      expired_at: null,
      canceled_at: null,
      failed_at: null,
      replaced_at: null,
      replaced_by: null,
      replaces: null,
      asset_id: params.symbol.split('/')[0],
      symbol: params.symbol,
      asset_class: 'crypto',
      qty: params.qty || '0',
      filled_qty: '0',
      type: params.type,
      side: params.side,
      time_in_force: params.time_in_force,
      limit_price: params.limit_price || null,
      stop_price: params.stop_price || null,
      filled_avg_price: null,
      status: 'accepted',
      extended_hours: false,
      legs: null,
      trail_percent: null,
      trail_price: null,
      hwm: null,
    };

    this.logger.log(`Created mock order with ID: ${mockOrder.id}`);

    // Log the mock order instead of saving to DB
    this.logger.debug(
      `Mock order details: ${JSON.stringify(mockOrder, null, 2)}`,
    );

    return mockOrder;
  }

  /**
   * Logs mock order details for tracking purposes.
   * This is a simplified version that just logs the order.
   * In a production environment, you might want to save to a database.
   * @param order - The mock order to log.
   */
  private logMockOrderDetails(order: Order): void {
    try {
      // Log the order details for tracking
      this.logger.log(
        `Mock order tracked: ${order.id} - ${order.side} ${order.qty || 'unknown'} ${order.symbol} at ${new Date().toISOString()}`,
      );
      // In a real implementation, you might save this to a database table
    } catch (err) {
      const error = ensureError(err);
      this.logger.error(`Error logging mock order: ${error.message}`);
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

  /**
   * Places a crypto order via the Alpaca API.
   * @param params - The order parameters.
   * @returns A promise that resolves to the created order.
   */
  async placeCryptoOrder(params: OrderParams): Promise<Order> {
    this.logger.log(
      `Placing ${params.type} ${params.side} order for ${params.symbol}...`,
    );

    try {
      // Validate the symbol format (should be in the format BTC/USD, ETH/USD, etc.)
      if (!params.symbol.includes('/')) {
        throw new Error(
          `Invalid crypto symbol format: ${params.symbol}. Expected format: BTC/USD`,
        );
      }

      // Validate required parameters based on order type
      if (params.type === 'limit' || params.type === 'stop_limit') {
        if (!params.limit_price) {
          throw new Error(
            'Limit price is required for limit and stop_limit orders',
          );
        }
      }

      if (params.type === 'stop_limit' && !params.stop_price) {
        throw new Error('Stop price is required for stop_limit orders');
      }

      // Either qty or notional must be provided
      if (!params.qty && !params.notional) {
        throw new Error('Either qty or notional must be provided');
      }

      // If mock mode is enabled, return a mock order response
      if (this.mockMode) {
        this.logger.warn(
          `MOCK MODE: Simulating ${params.side} order for ${params.symbol}`,
        );
        return this.createMockOrder(params);
      }

      // If not in mock mode, proceed with real API call
      const orderUnknown: unknown = await this.alpaca.createOrder(params);

      if (isOrder(orderUnknown)) {
        const order = orderUnknown;
        this.logger.log(`Successfully placed order: ${order.id}`);
        return order;
      }

      throw new Error('Received invalid order data from Alpaca.');
    } catch (err: unknown) {
      const error = ensureError(err);
      this.logger.error(`Failed to place crypto order: ${error.message}`);
      throw new Error(`Alpaca API Error: ${error.message}`);
    }
  }

  /**
   * Places a market buy order for a crypto asset.
   * @param symbol - The crypto trading pair (e.g., 'BTC/USD').
   * @param qty - The quantity to buy.
   * @returns A promise that resolves to the created order.
   */
  async buyCrypto(
    symbol: string,
    qty?: string,
    notional?: string,
  ): Promise<Order> {
    if (!qty && !notional) {
      throw new Error('Either qty or notional must be provided');
    }

    return this.placeCryptoOrder({
      symbol,
      qty,
      notional,
      side: 'buy',
      type: 'market',
      time_in_force: 'gtc',
    });
  }

  /**
   * Places a market sell order for a crypto asset.
   * @param symbol - The crypto trading pair (e.g., 'BTC/USD').
   * @param qty - The quantity to sell.
   * @returns A promise that resolves to the created order.
   */
  async sellCrypto(
    symbol: string,
    qty?: string,
    notional?: string,
  ): Promise<Order> {
    if (!qty && !notional) {
      throw new Error('Either qty or notional must be provided');
    }

    return this.placeCryptoOrder({
      symbol,
      qty,
      notional,
      side: 'sell',
      type: 'market',
      time_in_force: 'gtc',
    });
  }

  /**
   * Places a stop-loss order for a crypto position.
   * @param symbol - The crypto trading pair (e.g., 'BTC/USD').
   * @param qty - The quantity to sell.
   * @param stopPrice - The price at which the stop-limit order becomes active.
   * @param limitPrice - The limit price for the order.
   * @returns A promise that resolves to the created order.
   */
  async placeCryptoStopLoss(
    symbol: string,
    qty: string,
    stopPrice: string,
    limitPrice: string,
  ): Promise<Order> {
    return this.placeCryptoOrder({
      symbol,
      qty,
      side: 'sell',
      type: 'stop_limit',
      time_in_force: 'gtc',
      stop_price: stopPrice,
      limit_price: limitPrice,
    });
  }

  /**
   * Places a take-profit order for a crypto position.
   * @param symbol - The crypto trading pair (e.g., 'BTC/USD').
   * @param qty - The quantity to sell.
   * @param limitPrice - The limit price for the order.
   * @returns A promise that resolves to the created order.
   */
  async placeCryptoTakeProfit(
    symbol: string,
    qty: string,
    limitPrice: string,
  ): Promise<Order> {
    return this.placeCryptoOrder({
      symbol,
      qty,
      side: 'sell',
      type: 'limit',
      time_in_force: 'gtc',
      limit_price: limitPrice,
    });
  }

  /**
   * Retrieves an order by its ID.
   * @param orderId - The ID of the order to retrieve.
   * @returns A promise that resolves to the order, or null if not found.
   */
  async getOrder(orderId: string): Promise<Order | null> {
    this.logger.log(`Fetching order: ${orderId}...`);
    try {
      const orderUnknown: unknown = await this.alpaca.getOrder(orderId);

      if (isOrder(orderUnknown)) {
        const order = orderUnknown;
        return order;
      }

      this.logger.warn(`Invalid order data received for ID: ${orderId}`);
      return null;
    } catch (err: unknown) {
      // Check if the error indicates that the order was not found (404).
      if (isAlpacaApiError(err) && err.statusCode === 404) {
        this.logger.log(`No order found with ID: ${orderId}`);
        return null;
      }

      const error = ensureError(err);
      this.logger.error(`Error fetching order ${orderId}: ${error.message}`);
      throw new Error(`Could not fetch order from Alpaca: ${error.message}`);
    }
  }

  /**
   * Cancels an order by its ID.
   * @param orderId - The ID of the order to cancel.
   * @returns A promise that resolves to true if the order was canceled successfully.
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    this.logger.log(`Canceling order: ${orderId}...`);
    try {
      await this.alpaca.cancelOrder(orderId);
      this.logger.log(`Successfully canceled order: ${orderId}`);
      return true;
    } catch (err: unknown) {
      // If the order is already canceled or doesn't exist, consider it a success
      if (
        isAlpacaApiError(err) &&
        (err.statusCode === 404 || err.statusCode === 422)
      ) {
        this.logger.log(`Order ${orderId} already canceled or doesn't exist`);
        return true;
      }

      const error = ensureError(err);
      this.logger.error(`Error canceling order ${orderId}: ${error.message}`);
      throw new Error(`Could not cancel order: ${error.message}`);
    }
  }

  /**
   * Executes a trade with stop-loss and take-profit orders.
   * @param symbol - The crypto trading pair (e.g., 'BTC/USD').
   * @param side - The side of the trade ('buy' or 'sell').
   * @param qty - The quantity to trade.
   * @param stopLossPercentage - The percentage below entry price for stop-loss (for buys).
   * @param takeProfitPercentage - The percentage above entry price for take-profit (for buys).
   * @returns A promise that resolves to the primary order and any conditional orders.
   */
  async executeCryptoTradeWithRiskManagement(
    symbol: string,
    side: OrderSide,
    qty: string,
    stopLossPercentage = 5, // Default 5% stop loss
    takeProfitPercentage = 10, // Default 10% take profit
  ): Promise<{ primaryOrder: Order; stopLoss?: Order; takeProfit?: Order }> {
    try {
      // Place the primary order
      let primaryOrder: Order;

      if (side === 'buy') {
        primaryOrder = await this.buyCrypto(symbol, qty);
      } else {
        primaryOrder = await this.sellCrypto(symbol, qty);
      }

      // Wait for the order to be filled
      let filledOrder = primaryOrder;
      if (primaryOrder.status !== 'filled') {
        // Poll for order status until filled or a timeout
        const maxAttempts = 10;
        let attempts = 0;

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

          const updatedOrder = await this.getOrder(primaryOrder.id);
          if (!updatedOrder) {
            break;
          }

          if (updatedOrder.status === 'filled') {
            filledOrder = updatedOrder;
            break;
          }

          if (
            ['canceled', 'expired', 'rejected', 'suspended'].includes(
              updatedOrder.status,
            )
          ) {
            throw new Error(`Order failed with status: ${updatedOrder.status}`);
          }

          attempts++;
        }

        if (filledOrder.status !== 'filled') {
          throw new Error('Order did not fill within the expected timeframe');
        }
      }

      // Only place stop-loss and take-profit orders for buy orders
      if (side === 'buy' && filledOrder.filled_avg_price) {
        const entryPrice = parseFloat(filledOrder.filled_avg_price);
        const stopLossPrice = (
          (entryPrice * (100 - stopLossPercentage)) /
          100
        ).toFixed(2);
        const takeProfitPrice = (
          (entryPrice * (100 + takeProfitPercentage)) /
          100
        ).toFixed(2);

        // Place stop-loss order
        const stopLossOrder = await this.placeCryptoStopLoss(
          symbol,
          qty,
          stopLossPrice,
          stopLossPrice, // Use the same price for stop and limit to ensure execution
        );

        // Place take-profit order
        const takeProfitOrder = await this.placeCryptoTakeProfit(
          symbol,
          qty,
          takeProfitPrice,
        );

        return {
          primaryOrder: filledOrder,
          stopLoss: stopLossOrder,
          takeProfit: takeProfitOrder,
        };
      }

      return { primaryOrder: filledOrder };
    } catch (err: unknown) {
      const error = ensureError(err);
      this.logger.error(
        `Failed to execute trade with risk management: ${error.message}`,
      );
      throw new Error(`Trade execution failed: ${error.message}`);
    }
  }
}
