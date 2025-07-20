# Market Data Module

## Overview

The Market Data Module is a foundational component of the Helios Trading Bot that provides comprehensive cryptocurrency market data, with a specific focus on meme coins and trending cryptocurrencies. It aggregates data from multiple sources including exchanges, aggregators, and specialized APIs to deliver real-time and historical price information, trading volumes, market capitalization, and trending coin identification.

## Technology Stack

- **NestJS**: Framework for the module structure and dependency injection
- **TypeScript**: Strongly-typed language for robust implementation
- **HTTP Clients**: For fetching data from cryptocurrency APIs and exchanges
- **WebSockets**: For real-time market data streaming where applicable
- **External APIs**: Integration with CoinGecko, CoinMarketCap, and other crypto data providers

## Architecture

The Market Data Module follows the standard NestJS architecture:

- **MarketDataService**: Core service that fetches and processes market data
- **MarketDataModule**: Bundles the service and manages dependencies
- **MarketDataController**: (Optional) Exposes market data endpoints if needed

## Integration Points

- **AgentService**: Consumes market data to inform trading decisions
- **SentimentService**: Correlates market data with sentiment indicators
- **RiskService**: Uses market data for volatility and liquidity assessments
- **AlpacaService**: Complements Alpaca data with additional crypto-specific information
- **External APIs**: Fetches raw market data from cryptocurrency data providers

## Key Components

### MarketDataService

The `MarketDataService` is responsible for:

1. **Price Data**: Retrieving current and historical price information for cryptocurrencies
2. **Volume Analysis**: Tracking trading volumes across exchanges and time periods
3. **Market Metrics**: Providing market capitalization, circulating supply, and other tokenomics data
4. **Trending Coins**: Identifying trending and newly listed cryptocurrencies
5. **Exchange Data**: Gathering exchange-specific information like order books and liquidity
6. **Technical Indicators**: Calculating common technical indicators for analysis

#### Methods

| Method | Purpose | Parameters | Returns |
|--------|---------|------------|---------|
| `getTrendingCoins()` | Retrieves currently trending cryptocurrencies from sources like CoinGecko. | None | `Promise<TrendingCoin[]>` - List of trending cryptocurrencies. |
| `getPrice(symbol: string)` | Fetches the current price of a specific cryptocurrency. | `symbol: string` - The cryptocurrency symbol | `Promise<PriceData>` - Current price information. |
| `getHistoricalPrices(symbol: string, timeframe: Timeframe)` | Retrieves historical price data for a cryptocurrency. | `symbol: string` - The cryptocurrency symbol, `timeframe: Timeframe` - The time period | `Promise<HistoricalPriceData>` - Historical price data. |
| `getMarketMetrics(symbol: string)` | Fetches comprehensive market metrics for a cryptocurrency. | `symbol: string` - The cryptocurrency symbol | `Promise<MarketMetrics>` - Market metrics data. |
| `getNewListings(limit: number)` | Identifies newly listed cryptocurrencies. | `limit: number` - Maximum number of results | `Promise<NewListing[]>` - Newly listed cryptocurrencies. |

### Data Models

#### TrendingCoin

```typescript
export interface TrendingCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  marketCapRank: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCap: number;
  totalVolume: number;
  score: number; // Trending score
}
```

#### PriceData

```typescript
export interface PriceData {
  symbol: string;
  price: number;
  currency: string;
  timestamp: Date;
  source: string;
  priceChange24h: number;
  priceChangePercentage24h: number;
  volume24h: number;
  marketCap: number;
}
```

#### MarketMetrics

```typescript
export interface MarketMetrics {
  symbol: string;
  name: string;
  marketCap: number;
  fullyDilutedValuation: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  ath: number; // All-time high
  athDate: Date;
  atl: number; // All-time low
  atlDate: Date;
  roi: {
    percentage: number;
    usdValue: number;
    fromDate: Date;
  } | null;
  liquidityScore: number; // 0-1000
  exchangeCount: number;
  lastUpdated: Date;
}
```

## When to Use

- **Market Analysis**: For comprehensive cryptocurrency market analysis
- **Trend Identification**: To discover trending and emerging meme coins
- **Price Monitoring**: For real-time and historical price tracking
- **Trading Strategy Development**: When developing and backtesting trading strategies
- **Market Context**: To provide market context to sentiment and risk analysis

## When Not to Use

- **Ultra-Low Latency Trading**: When microsecond-level latency is required
- **Proprietary Trading Signals**: For strategies requiring custom or proprietary data
- **Non-Crypto Assets**: This module is specialized for cryptocurrency data

## Tips for New Developers

- Most cryptocurrency APIs have rate limits; implement appropriate throttling and caching
- Consider implementing a local cache for frequently accessed data to reduce API calls
- Price data can vary between sources; consider aggregating from multiple providers for accuracy
- WebSocket connections provide more timely data but require connection management
- For historical data, consider storing locally for backtesting purposes
- The module is designed to prioritize meme coins and trending cryptocurrencies
- CoinGecko API is the primary source for trending coin identification
- Market data should be refreshed at appropriate intervals based on the use case
- Be aware of potential API outages and implement fallback data sources

## Recent Changes

- Integrated with the AgentModule for autonomous meme coin trading workflow
- Enhanced trending coin detection with additional data sources
- Improved caching strategy to reduce external API calls
- Added support for new meme coin metrics and indicators
- Optimized performance for faster market data retrieval
