# Agent Module

## Overview

The Agent module is the AI-powered brain of the Helios Trading Bot. It integrates LangChain.js with OpenAI's language models to create an intelligent trading assistant that can understand natural language queries about trading, market data, and portfolio information.

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

- **AlpacaService**: Used to fetch trading account information and market data
- **OpenAI API**: External service for language model capabilities
- **Frontend Chat Interface**: Consumes the agent API for user interactions

## API Endpoints

### `POST /agent/query`

Process a natural language query about trading or market data.

**Request Body:**
```json
{
  "query": "What is the current balance of my portfolio?"
}
```

**Response:**
```json
{
  "response": "Your current portfolio balance is $10,000 with $5,000 in cash and $5,000 in equity positions."
}
```

### `GET /agent/health`

Check if the agent service is operational.

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
