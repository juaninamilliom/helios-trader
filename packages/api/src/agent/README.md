# Agent Module

## Overview

The Agent module is the AI-powered brain of the Helios Trading Bot. It integrates LangChain.js with OpenAI's language models to create an intelligent trading assistant that can understand natural language queries about trading, market data, and portfolio information. The agent has been enhanced to focus on cryptocurrency trading, particularly meme coins, with autonomous capabilities for identifying, analyzing, and executing trades on trending tokens.

## Technology Stack

- **LangChain.js**: Framework for building applications with large language models
- **OpenAI**: Provider of the underlying language model (ChatGPT)
- **NestJS**: Framework for the module structure and dependency injection

## Architecture

The Agent module follows the standard NestJS architecture:

- **AgentController**: Handles HTTP requests to the agent endpoints
- **AgentService**: Contains the business logic for setting up and interacting with the AI agent
- **AgentModule**: Bundles the controller and service, and manages dependencies

## Integration Points

- **AlpacaService**: Used to fetch trading account information, execute trades, and access crypto market data
- **MarketDataService**: Provides trending coin information and crypto market metrics
- **SentimentService**: Delivers social media sentiment analysis for meme coins
- **RiskService**: Offers risk assessment for potential crypto trades
- **OpenAI API**: External service for language model capabilities
- **Frontend Chat Interface**: Consumes the agent API for user interactions

## Agent Tools

The agent is equipped with specialized tools to perform autonomous meme coin trading:

### Trading Tools

- **executeTradeTool**: Executes cryptocurrency trades via the AlpacaService
- **getAccountInfoTool**: Retrieves account balance and portfolio information
- **getMarketDataTool**: Fetches current market data for specific cryptocurrencies
- **getTrendingCoinsTool**: Identifies trending meme coins for potential trading opportunities
- **analyzeSentimentTool**: Performs sentiment analysis on social media for specific coins
- **assessRiskTool**: Evaluates risk factors for potential trades

### Mock Trading Mode

The agent supports mock trading mode for safe testing:

- When `MOCK_TRADING=true` is set in the environment, all trades executed by the agent will be simulated
- Mock trades are logged but not actually executed on the exchange
- This allows for safe testing of the agent's decision-making process without financial risk

## API Endpoints

### `POST /agent/query`

Process a natural language query about trading or market data, including crypto trading requests.

**Request Body:**
```json
{
  "input": "Execute a trade for BTC/USD with a quantity of 0.001 BTC"
}
```

**Response:**
```json
{
  "response": "I've executed a market order to buy 0.001 BTC at the current price of $63,245.78. Order ID: mock-ord-123456 has been placed successfully. This is a mock order as mock trading mode is enabled."
}
```

### `GET /agent/health`

Check if the agent service is operational.

## When to Use

- **Autonomous Trading**: When you want the system to autonomously identify and execute trades on trending meme coins
- **Market Analysis**: For comprehensive analysis of cryptocurrency markets and specific tokens
- **Sentiment-Driven Trading**: When social media sentiment should influence trading decisions
- **Risk-Aware Trading**: When you need risk assessment integrated into trading decisions
- **Natural Language Interaction**: For human-friendly interaction with the trading system
- **Testing Trading Strategies**: Use with mock mode to safely test trading strategies without financial risk

## When Not to Use

- **High-Frequency Trading**: The agent is not designed for ultra-low-latency trading
- **Fully Automated Production**: Without human oversight in high-risk scenarios
- **Complex Derivatives Trading**: Currently focused on spot trading of cryptocurrencies
- **Regulatory Sensitive Environments**: Where AI-driven trading may have compliance implications

## Tips for New Developers

- **OpenAI API Key**: Ensure a valid OpenAI API key is set in the `.env` file for the agent to function
- **Mock Mode**: Always use `MOCK_TRADING=true` during development and testing
- **Tool Development**: When adding new capabilities, implement them as LangChain tools for the agent
- **Error Handling**: The agent includes robust error handling for API failures and invalid requests
- **Prompt Engineering**: The agent's effectiveness depends on well-crafted prompts and instructions
- **Memory Management**: Consider the agent's context window limitations when designing interactions
- **Testing**: Use unit tests with mock responses for consistent agent behavior verification
- **Logging**: Enable detailed logging during development to understand the agent's decision process

## Recent Changes

- **Meme Coin Focus**: Shifted focus from stock trading to cryptocurrency trading, particularly meme coins
- **Autonomous Trading**: Enhanced agent with autonomous trading capabilities for trending coins
- **Sentiment Analysis**: Integrated social media sentiment analysis for trading decisions
- **Risk Assessment**: Added comprehensive risk evaluation for potential trades
- **Mock Trading Mode**: Implemented safe testing mode that prevents real transactions
- **Market Data Integration**: Connected to CoinGecko and other sources for trending coin identification
- **Tool Refactoring**: Updated agent tools for cryptocurrency-specific operations

**Response:**
```json
{
  "status": "ok",
  "message": "Agent service is running"
}
```

## Key Components

### AgentService

The `AgentService` is responsible for:

1. **Setting up the AI agent**: Initializing the ChatOpenAI model and creating a React agent with tools
2. **Defining tools**: Creating functions that the AI can use to fetch data from Alpaca
3. **Processing queries**: Handling user queries and returning responses

#### Methods

| Method | Purpose | Parameters | Returns |
|--------|---------|------------|---------|
| `setupAgent()` | Initialize the LangChain agent with tools | None | Promise<void> |
| `query(input: string)` | Process a user query | input: string - The user's natural language query | Promise<string> - The agent's response |
| `getAccountInfoTool()` | Tool for fetching account information | None | Dynamic function for the agent |
| `getPositionsTool()` | Tool for fetching portfolio positions | None | Dynamic function for the agent |

### AgentController

The `AgentController` exposes the agent functionality via HTTP endpoints.

#### Methods

| Method | Purpose | Endpoint | Request | Response |
|--------|---------|----------|---------|----------|
| `query(queryDto)` | Process a query through the agent | POST /agent/query | { query: string } | { response: string } |
| `health()` | Check service health | GET /agent/health | None | { status: string, message: string } |

## Error Handling

The module implements comprehensive error handling:

1. **Service Level**: Try-catch blocks around agent setup and query processing
2. **Controller Level**: HTTP exceptions with appropriate status codes
3. **Logging**: Detailed logging for debugging and monitoring

## Configuration

The agent requires the following environment variables:

- `OPENAI_API_KEY`: API key for OpenAI services

## Usage Examples

### Basic Query

```typescript
// From another service
@Injectable()
export class TradingService {
  constructor(private readonly agentService: AgentService) {}

  async analyzeMarket(query: string): Promise<string> {
    return this.agentService.query(query);
  }
}
```

### HTTP Request

```bash
curl -X POST http://localhost:3000/api/agent/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What stocks are in my portfolio?"}'
```

## Extending the Agent

To add new capabilities to the agent:

1. Create a new tool function in `AgentService`
2. Add the tool to the `tools` array in the `setupAgent` method
3. Update the agent prompt if necessary to inform the AI about the new capability

Example of adding a new tool:

```typescript
private getMarketNewsTool() {
  return {
    name: 'get_market_news',
    description: 'Get the latest market news for a specific symbol',
    func: async (symbol: string) => {
      try {
        const news = await this.alpacaService.getMarketNews(symbol);
        return JSON.stringify(news);
      } catch (error) {
        return `Error fetching market news: ${error.message}`;
      }
    },
  };
}
```

## Testing

The agent module includes unit tests for both the controller and service:

```bash
# Run tests for the agent module
npm run test -- agent
```
