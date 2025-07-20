# Risk Module

## Overview

The Risk Module is a critical component of the Helios Trading Bot that evaluates and assesses the risk associated with potential cryptocurrency trades, with a particular focus on meme coins. It provides comprehensive risk analysis by examining various factors including liquidity, holder concentration, contract safety, and market volatility to ensure trading decisions are well-informed and protected against common crypto risks.

## Technology Stack

- **NestJS**: Framework for the module structure and dependency injection
- **TypeScript**: Strongly-typed language for robust implementation
- **Web3.js/Ethers.js**: For on-chain contract analysis (when applicable)
- **External APIs**: Integration with blockchain explorers and risk assessment services

## Architecture

The Risk Module follows the standard NestJS architecture:

- **RiskService**: Core service that performs risk assessment calculations
- **RiskModule**: Bundles the service and manages dependencies
- **RiskController**: (Optional) Exposes risk assessment endpoints if needed

## Integration Points

- **AgentService**: Consumes the Risk service to evaluate trades before execution
- **SentimentService**: Provides sentiment data that may influence risk assessment
- **AlpacaService**: Receives risk assessment results to make informed trading decisions
- **External Risk APIs**: Fetches additional risk data from third-party services

## Key Components

### RiskService

The `RiskService` is responsible for:

1. **Risk Assessment**: Evaluating overall risk scores for potential trades
2. **Liquidity Analysis**: Assessing if a token has sufficient liquidity for safe trading
3. **Holder Concentration**: Analyzing token distribution to detect potential rug pulls
4. **Contract Safety**: Checking for common smart contract vulnerabilities
5. **Market Volatility**: Evaluating price stability and volatility patterns
6. **Mock Risk Data**: Providing simulated risk assessments for testing

#### Methods

| Method | Purpose | Parameters | Returns |
|--------|---------|------------|---------|
| `assessRisk(symbol: string, amount: number)` | Performs a comprehensive risk assessment for a potential trade. | `symbol: string` - The cryptocurrency symbol, `amount: number` - The trade amount | `Promise<RiskAssessment>` - The risk assessment results. |
| `checkLiquidity(symbol: string, amount: number)` | Evaluates if there's sufficient liquidity for the trade. | `symbol: string` - The cryptocurrency symbol, `amount: number` - The trade amount | `Promise<LiquidityCheck>` - Liquidity assessment. |
| `getMockRiskAssessment(symbol: string)` | Generates mock risk data for testing purposes. | `symbol: string` - The cryptocurrency symbol | `RiskAssessment` - Simulated risk data. |

### Data Models

#### RiskAssessment

```typescript
export interface RiskAssessment {
  symbol: string;
  overallRiskScore: number; // 0-100, higher means more risky
  liquidityScore: number; // 0-100
  holderConcentrationScore: number; // 0-100
  contractSafetyScore: number; // 0-100
  volatilityScore: number; // 0-100
  recommendation: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'EXTREME_RISK';
  warnings: string[];
  timestamp: Date;
}
```

#### LiquidityCheck

```typescript
export interface LiquidityCheck {
  symbol: string;
  hasAdequateLiquidity: boolean;
  liquidityAmount: number;
  slippageEstimate: number; // Percentage
  recommendedMaxTradeSize: number;
}
```

## When to Use

- **Pre-Trade Validation**: Always use risk assessment before executing trades
- **Portfolio Management**: Evaluate overall portfolio risk exposure
- **New Token Analysis**: When considering adding a new token to trading strategies
- **Market Condition Changes**: Re-evaluate risk during significant market movements

## When Not to Use

- **High-Frequency Trading**: Risk assessment adds latency not suitable for HFT
- **Well-Established Assets**: Less critical for highly liquid, established cryptocurrencies
- **Technical Analysis Only**: When strategy relies solely on technical indicators

## Tips for New Developers

- Risk scores are normalized on a scale of 0-100, with higher scores indicating higher risk
- The service includes mock data generation for testing without external dependencies
- Risk assessment is asynchronous and may involve multiple API calls; handle promises appropriately
- Consider caching risk results for frequently traded assets to improve performance
- The module is designed to be extensible; new risk factors can be added to the assessment
- Risk thresholds should be configurable based on trading strategy and risk tolerance
- Always handle potential API failures gracefully with appropriate fallbacks

## Recent Changes

- Fixed TypeScript/ESLint lint errors in the RiskService implementation
- Improved error handling for asynchronous operations
- Enhanced mock data generation for testing scenarios
- Optimized performance for faster risk assessments
