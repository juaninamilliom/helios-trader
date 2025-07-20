# Sentiment Module

## Overview

The Sentiment Module is a crucial component of the Helios Trading Bot that analyzes social media, news, and community sentiment around cryptocurrencies, with a specific focus on meme coins. It aggregates and processes sentiment data from various sources to provide insights into market perception, helping to identify trending coins and predict potential price movements based on social signals.

## Technology Stack

- **NestJS**: Framework for the module structure and dependency injection
- **TypeScript**: Strongly-typed language for robust implementation
- **HTTP Clients**: For fetching data from social media APIs and news sources
- **Natural Language Processing**: For sentiment analysis of text content
- **External APIs**: Integration with sentiment analysis services and social media platforms

## Architecture

The Sentiment Module follows the standard NestJS architecture:

- **SentimentService**: Core service that performs sentiment analysis and aggregation
- **SentimentModule**: Bundles the service and manages dependencies
- **SentimentController**: (Optional) Exposes sentiment analysis endpoints if needed

## Integration Points

- **AgentService**: Consumes the Sentiment service to incorporate social signals into trading decisions
- **RiskService**: Receives sentiment data to factor into risk assessments
- **MarketDataService**: Complements price data with sentiment indicators
- **External APIs**: Fetches raw sentiment data from social media platforms and news sources

## Key Components

### SentimentService

The `SentimentService` is responsible for:

1. **Social Media Monitoring**: Tracking mentions and discussions of cryptocurrencies on platforms like Twitter/X, Reddit, and Discord
2. **Sentiment Analysis**: Evaluating the positive, negative, or neutral tone of discussions
3. **Trend Detection**: Identifying emerging trends and viral discussions around specific coins
4. **Volume Analysis**: Measuring the volume and intensity of social media activity
5. **Influencer Tracking**: Monitoring key influencers' opinions and their market impact
6. **Sentiment Aggregation**: Combining multiple sources into a unified sentiment score

#### Methods

| Method | Purpose | Parameters | Returns |
|--------|---------|------------|---------|
| `analyzeSentiment(symbol: string)` | Performs comprehensive sentiment analysis for a cryptocurrency. | `symbol: string` - The cryptocurrency symbol | `Promise<SentimentAnalysis>` - The sentiment analysis results. |
| `getSocialMediaMentions(symbol: string, timeframe: Timeframe)` | Retrieves social media mentions for a specific cryptocurrency. | `symbol: string` - The cryptocurrency symbol, `timeframe: Timeframe` - The time period to analyze | `Promise<SocialMediaMentions>` - Social media mention data. |
| `detectTrendingCoins()` | Identifies cryptocurrencies currently trending on social media. | None | `Promise<TrendingCoin[]>` - List of trending cryptocurrencies. |
| `getInfluencerSentiment(symbol: string)` | Analyzes key influencers' sentiment about a specific cryptocurrency. | `symbol: string` - The cryptocurrency symbol | `Promise<InfluencerSentiment[]>` - Influencer sentiment data. |

### Data Models

#### SentimentAnalysis

```typescript
export interface SentimentAnalysis {
  symbol: string;
  overallSentimentScore: number; // -100 to 100, higher is more positive
  socialMediaScore: number; // -100 to 100
  newsSentimentScore: number; // -100 to 100
  communityScore: number; // -100 to 100
  mentionVolume: number; // Relative to baseline
  mentionVolumeChange: number; // Percentage change
  trending: boolean;
  topKeywords: string[];
  timestamp: Date;
}
```

#### SocialMediaMentions

```typescript
export interface SocialMediaMentions {
  symbol: string;
  platform: 'twitter' | 'reddit' | 'discord' | 'telegram' | 'all';
  mentionCount: number;
  sentimentBreakdown: {
    positive: number; // Percentage
    neutral: number; // Percentage
    negative: number; // Percentage
  };
  topPosts: {
    content: string;
    engagement: number;
    sentiment: number;
    url?: string;
  }[];
  timeframe: Timeframe;
}
```

#### TrendingCoin

```typescript
export interface TrendingCoin {
  symbol: string;
  name: string;
  mentionCount: number;
  mentionIncrease: number; // Percentage increase over baseline
  sentimentScore: number;
  firstDetectedAt: Date;
  sources: string[]; // Platforms where trending
}
```

## When to Use

- **Market Entry Timing**: Identify optimal entry points based on positive sentiment shifts
- **Trend Identification**: Discover emerging meme coins before they gain mainstream attention
- **Risk Mitigation**: Detect negative sentiment shifts that may precede price drops
- **Validation**: Confirm technical analysis signals with sentiment indicators
- **Community Pulse**: Understand the general market sentiment around specific assets

## When Not to Use

- **High-Frequency Trading**: Sentiment analysis adds latency not suitable for HFT
- **Fundamental Analysis**: When focusing purely on tokenomics and project fundamentals
- **Long-term Investing**: For very long-term positions where short-term sentiment is less relevant
- **Illiquid Assets**: For cryptocurrencies with minimal social media presence

## Tips for New Developers

- Sentiment scores range from -100 (extremely negative) to 100 (extremely positive)
- Social media APIs often have rate limits; implement appropriate throttling and caching
- Sentiment analysis is subjective; use it as one signal among many, not as the sole decision factor
- Consider the source quality when weighing sentiment; verified accounts may carry more weight
- Implement sentiment trend analysis rather than relying on absolute values
- Be aware of potential manipulation in social media sentiment, especially for smaller coins
- The module includes mock data generation for testing without external API dependencies
- Sentiment analysis is computationally intensive; consider background processing for large datasets

## Recent Changes

- Integrated with the AgentModule for autonomous trading workflow
- Enhanced trend detection algorithms for early identification of viral meme coins
- Improved sentiment scoring with weighted platform importance
- Added support for tracking sentiment across multiple languages
- Optimized caching strategy to reduce external API calls
