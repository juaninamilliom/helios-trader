# Alpaca Module

## Overview

The Alpaca module serves as the integration layer between the Helios Trading Bot and the Alpaca Markets API. It provides a clean, abstracted interface for accessing trading functionality, market data, and account information from Alpaca's commission-free trading platform.

## Technology Stack

- **Alpaca API**: RESTful API for trading stocks and cryptocurrencies
- **@alpacahq/alpaca-trade-api**: Official Node.js client library for Alpaca
- **NestJS**: Framework for the module structure and dependency injection

## Architecture

The Alpaca module follows the standard NestJS architecture:

- **AlpacaService**: Core service that wraps the Alpaca API client
- **AlpacaModule**: Bundles the service and manages dependencies

## Integration Points

- **AgentService**: Consumes the Alpaca service to provide trading data to the AI agent
- **Alpaca Markets API**: External service for executing trades and fetching market data
- **Environment Configuration**: Uses API keys from environment variables

## Key Components

### AlpacaService

The `AlpacaService` is responsible for:

1. **Initializing the Alpaca client**: Setting up the connection with API credentials
2. **Account operations**: Fetching account information and balances
3. **Portfolio management**: Getting positions, orders, and trade history
4. **Market data**: Retrieving price quotes, bars, and other market information

#### Methods

| Method | Purpose | Parameters | Returns |
|--------|---------|------------|---------|
| `getAccountInfo()` | Fetches account information from Alpaca. | None | `Promise<Account>` - The account information. |
| `getPositions()` | Fetches all positions from Alpaca. | None | `Promise<Position[]>` - An array of positions. |
| `getPosition(symbol: string)` | Fetches a specific position by its symbol from Alpaca. | `symbol: string` - The stock symbol of the position to fetch. | `Promise<Position | null>` - The position, or null if not found. |

### Data Models

#### Account

```typescript
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
  [key: string]: any;
}
```

#### Position

```typescript
interface Position {
  asset_id: string;
  symbol: string;
  qty: string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  [key: string]: any;
}
```

## Configuration

The Alpaca module requires the following environment variables:

- `ALPACA_API_KEY`: API key for Alpaca services
- `ALPACA_SECRET_KEY`: Secret key for Alpaca services
- `ALPACA_API_BASE_URL`: Base URL for the Alpaca API (defaults to paper trading URL)

## Error Handling

The module implements comprehensive error handling:

1. **API Error Handling**: Catches and processes Alpaca API errors
2. **Rate Limiting**: Respects Alpaca's rate limits to prevent API throttling
3. **Logging**: Detailed logging for debugging and monitoring

## Usage Examples

### Basic Usage

```typescript
// From another service
@Injectable()
export class TradingStrategyService {
  constructor(private readonly alpacaService: AlpacaService) {}

  async executeStrategy(): Promise<void> {
    // Get account information
    const account = await this.alpacaService.getAccountInfo();
    
    // Check available buying power
    const buyingPower = parseFloat(account.buying_power);
    
    if (buyingPower > 1000) {
      // Place a buy order
      await this.alpacaService.placeOrder({
        symbol: 'AAPL',
        qty: 1,
        side: 'buy',
        type: 'market',
        time_in_force: 'day'
      });
    }
  }
}
```

### Fetching Portfolio Data

```typescript
// Get all positions
const positions = await this.alpacaService.getPositions();

// Calculate total portfolio value
const totalValue = positions.reduce((sum, position) => {
  return sum + parseFloat(position.market_value);
}, 0);
```

## Testing

The Alpaca module includes unit tests with mocked API responses:

```bash
# Run tests for the Alpaca module
npm run test -- alpaca
```

## Paper Trading vs. Live Trading

The Alpaca module supports both paper trading (simulated) and live trading environments:

- **Paper Trading**: Used for development and testing without real money
- **Live Trading**: Used in production with real funds

To switch between environments, update the `ALPACA_API_BASE_URL` in your `.env` file:

```
# Paper Trading
ALPACA_API_BASE_URL=https://paper-api.alpaca.markets

# Live Trading
ALPACA_API_BASE_URL=https://api.alpaca.markets
```

## Extending the Module

To add new Alpaca API capabilities:

1. Add a new method to the `AlpacaService` class
2. Implement the API call using the Alpaca client
3. Add appropriate error handling and logging
4. Update tests to cover the new functionality

Example of adding a new method:

```typescript
async getMarketNews(symbol: string): Promise<NewsItem[]> {
  try {
    const response = await this.alpacaClient.getNews({
      symbols: symbol,
      limit: 10
    });
    return response;
  } catch (error) {
    this.logger.error(`Error fetching news for ${symbol}: ${error.message}`);
    throw new Error(`Failed to fetch market news: ${error.message}`);
  }
}
```
