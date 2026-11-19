# Helios connected finance

The default app is a read-only finance dashboard with Google sign-in, Postgres persistence, real Plaid **Sandbox** Link, transaction synchronization and categorized activity. `/demo` is a separate, labeled fictional UI prototype. The finance API does not expose the legacy trading agent.

## Design and coding-agent guidance

Read [ARCHITECTURE.md](ARCHITECTURE.md) for the system design and decisions. [AGENTS.md](AGENTS.md) connects planning/review to the [living product-vertical architect references](.agents/architects/README.md).

## Local start

Requires Node.js 22+, npm and Docker Compose. From this repository:

```sh
npm ci
cp packages/api/.env.example packages/api/.env
node scripts/setup-finance-env.mjs
docker compose --env-file packages/api/.env.finance.local -f compose.finance.yml up -d db
npm run --workspace=api db:generate:finance
npm run --workspace=api db:migrate:finance
npm run dev
```

Fill Google OAuth and Plaid Sandbox values in the ignored `packages/api/.env`. Register `http://localhost:3001/api/authentication/google/callback` with Google. Open http://localhost:3001. Keep `.env.finance.local` and its generated encryption key private and stable. The database listens on localhost:55433; the API on localhost:3003.

Luna is the default classifier (`FINANCE_CLASSIFIER=luna`, `OPENAI_API_KEY`). Direct Jev uses `FINANCE_CLASSIFIER=jev`, `FINANCE_JEV_PROVIDER=typesafe`, `TYPESAFE_API_KEY` and `FINANCE_JEV_MODEL=jev-latest`. OpenRouter is an optional explicit transport, with a separate key and restricted provider routing. Provider or model changes invalidate prior AI consent. Enable the matching consent in Intelligence before classifying uncertain purchases. There is no automatic cross-provider fallback.

See [setup, provider configuration and verification](docs/architecture/finance-local-setup.md), [API contract](docs/api/finance.openapi.yaml), and [development server management](docs/architecture/dev-server-management.md). Development checks use `tsc --noEmit`; no build is required.

Sandbox supplies fictional accounts and transactions. Production/Trial Plaid, money movement, trading and a production deployment are outside this milestone. Model classifications never change accounting semantics. The legacy trading code below is retained for reference and is not started by `npm run dev`.

---

# Helios Trading Bot

Helios is an AI-powered trading assistant that helps you make informed trading decisions using natural language. The application integrates with Alpaca API for real-time market data and trade execution, and uses LangChain with OpenAI's GPT models to provide intelligent trading insights.

## Features

- **AI Trading Assistant**: Chat with an AI agent that understands trading concepts and can help analyze your portfolio
- **Portfolio Dashboard**: View your account summary, recent trades, and market performance
- **Alpaca API Integration**: Connect to your Alpaca trading account for real-time data and trade execution
- **TimescaleDB**: Store historical trading data for analysis and visualization

## Tech Stack

### Backend
- NestJS framework
- LangChain.js for AI agent capabilities
- Prisma ORM for database interactions
- Alpaca API for trading functionality
- TimescaleDB (PostgreSQL) for time-series data storage

### Frontend
- Next.js with React
- Tailwind CSS for styling
- shadcn/ui component library

## Prerequisites

- Node.js (v18.18.0 or higher recommended, v20+ preferred)
- npm (v10.2.5 or higher)
- Docker and Docker Compose (for TimescaleDB)
- Alpaca API keys (sign up at https://app.alpaca.markets/)
- OpenAI API key (sign up at https://platform.openai.com/)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/helios-trader.git
cd helios-trader
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp packages/api/.env.example packages/api/.env
```

Edit the `.env` file and add your API keys and database configuration:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/helios?schema=public"
ALPACA_API_KEY="your_alpaca_api_key"
ALPACA_SECRET_KEY="your_alpaca_secret_key"
OPENAI_API_KEY="your_openai_api_key"
```

4. Start the TimescaleDB database:

```bash
docker-compose up -d
```

5. Run database migrations:

```bash
cd packages/api
npx prisma migrate dev
```

## Running the Application

1. Start the backend API server:

```bash
# From the root directory
npm run start:api
```

The API will be available at http://localhost:3000

2. Start the frontend development server:

```bash
# From the root directory
npm run start:web
```

The frontend will be available at http://localhost:3001

## Usage

1. Open your browser and navigate to http://localhost:3001
2. You'll see the Helios Trading Bot homepage with links to the Dashboard and Chat
3. Visit the Dashboard to view your trading account information
4. Use the Chat interface to interact with the AI trading assistant

### API Endpoints

- `GET /api/agent/health` - Check if the agent service is running
- `POST /api/agent/query` - Send a query to the trading agent

## Development

- Backend code is located in `packages/api`
- Frontend code is located in `packages/web`
- Database schema is defined in `packages/api/prisma/schema.prisma`

## Troubleshooting

- If you encounter Node.js version compatibility issues, consider upgrading to Node.js v20+
- Make sure your API keys are correctly set in the `.env` file
- Ensure Docker is running before starting the database
- Check the database connection string if you encounter database connection issues
- **Backend (`packages/api`)**: NestJS (TypeScript)
    - **Agent Framework**: [LangChain.js](https://js.langchain.com/)
    - **Database**: PostgreSQL with TimescaleDB extension (managed via Docker)
    - **ORM**: [Prisma](https://www.prisma.io/)
    - **Broker API**: [Alpaca](https://alpaca.markets/)
- **Frontend (`packages/web`)**: Next.js (React, TypeScript)
    - **Styling**: Tailwind CSS
    - **UI Components**: shadcn/ui

## Local Development Setup

### Prerequisites
- Node.js (Latest LTS)
- Docker Desktop
- pnpm package manager

### 1. Install Dependencies
From the project root, run:
```bash
pnpm install
```

### 2. Set Up Environment Variables
Copy the example environment file in `packages/api` and fill in your details.
```bash
cp packages/api/.env.example packages/api/.env
```
**Note:** You must add your Alpaca Paper Trading API keys to the `.env` file.

### 3. Start the Database
This command starts a PostgreSQL/TimescaleDB container using Docker Compose.
```bash
docker-compose up -d
```

### 4. Run Database Migrations
This command applies the database schema to your running database.
```bash
pnpm --filter api prisma migrate dev
```

### 5. Run the Entire Application
This command starts both the backend API and the frontend web app concurrently.
```bash
pnpm dev
```
- The API will be running at `http://localhost:3000`.
- The web app will be running at `http://localhost:3001`.
