# Prisma Module

## Overview

The Prisma module serves as the data access layer for the Helios Trading Bot. It provides a type-safe, auto-generated client for interacting with the TimescaleDB database (PostgreSQL with time-series extensions), handling database connections, migrations, and CRUD operations for all application data.

## Technology Stack

- **Prisma ORM**: Next-generation TypeScript ORM for Node.js
- **TimescaleDB**: PostgreSQL extension optimized for time-series data
- **NestJS**: Framework for the module structure and dependency injection

## Architecture

The Prisma module follows a simplified NestJS architecture:

- **PrismaService**: Core service that manages the Prisma client lifecycle
- **PrismaModule**: Bundles the service and makes it available to other modules

## Integration Points

- **Other Services**: All other services that need database access consume the PrismaService
- **Database**: Connects to the TimescaleDB instance defined in the connection string
- **Schema**: Defined in `prisma/schema.prisma` at the project root

## Key Components

### PrismaService

The `PrismaService` is responsible for:

1. **Client Lifecycle**: Managing the Prisma client's connection lifecycle
2. **Connection Management**: Establishing and closing database connections
3. **Transaction Support**: Providing transaction capabilities to other services
4. **Model Access**: Exposing Prisma models for CRUD operations

#### Methods

| Method | Purpose | Parameters | Returns |
|--------|---------|------------|---------|
| `onModuleInit()` | Initialize the Prisma client when the module starts | None | Promise<void> |
| `onModuleDestroy()` | Gracefully shut down the Prisma client | None | Promise<void> |
| `enableShutdownHooks(app)` | Register shutdown hooks with NestJS | app: INestApplication | void |

### Database Schema

The database schema is defined in `prisma/schema.prisma` and includes models for:

- **User**: User account information
- **Trade**: Historical trade records
- **Position**: Current portfolio positions
- **MarketData**: Time-series market data points

Example model:

```prisma
model Trade {
  id          String   @id @default(uuid())
  userId      String
  symbol      String
  side        String   // 'buy' or 'sell'
  quantity    Float
  price       Float
  timestamp   DateTime @default(now())
  status      String   // 'filled', 'canceled', 'rejected'
  
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([symbol])
  @@index([timestamp])
}
```

## Configuration

The Prisma module requires the following environment variables:

- `DATABASE_URL`: Connection string for the TimescaleDB database

Example:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/helios?schema=public"
```

## Database Management

### Migrations

Prisma migrations are used to manage database schema changes:

```bash
# Create a new migration
npx prisma migrate dev --name add_new_feature

# Apply migrations to production
npx prisma migrate deploy
```

### Seeding

Database seeding can be performed using the Prisma seed script:

```bash
# Run database seed
npx prisma db seed
```

The seed script is defined in `prisma/seed.ts`.

## Usage Examples

### Basic CRUD Operations

```typescript
// From another service
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: { email: string; name: string }): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateUser(id: string, data: { name?: string }): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
```

### Transactions

```typescript
// Execute multiple operations in a transaction
const result = await this.prisma.$transaction(async (tx) => {
  // Create a trade record
  const trade = await tx.trade.create({
    data: {
      userId,
      symbol,
      side: 'buy',
      quantity,
      price,
      status: 'filled',
    },
  });

  // Update user's balance
  const updatedUser = await tx.user.update({
    where: { id: userId },
    data: {
      balance: { decrement: quantity * price },
    },
  });

  return { trade, updatedUser };
});
```

### Time-Series Queries

```typescript
// Get hourly price data for a symbol over the last week
const hourlyPrices = await this.prisma.$queryRaw`
  SELECT 
    time_bucket('1 hour', "timestamp") AS hour,
    symbol,
    FIRST(price, timestamp) as open,
    MAX(price) as high,
    MIN(price) as low,
    LAST(price, timestamp) as close
  FROM "MarketData"
  WHERE 
    symbol = ${symbol} 
    AND timestamp >= NOW() - INTERVAL '7 days'
  GROUP BY hour, symbol
  ORDER BY hour ASC
`;
```

## Error Handling

The module implements comprehensive error handling:

1. **Connection Errors**: Graceful handling of database connection issues
2. **Query Errors**: Proper error handling for failed queries
3. **Validation**: Type-safe operations with Prisma's generated types

## Testing

The Prisma module includes unit tests with a test database:

```bash
# Run tests for the Prisma module
npm run test -- prisma
```

## Extending the Schema

To add a new model to the database schema:

1. Update the `prisma/schema.prisma` file with the new model
2. Generate a migration: `npx prisma migrate dev --name add_new_model`
3. Update the Prisma client: `npx prisma generate`

Example of adding a new model:

```prisma
model Alert {
  id          String   @id @default(uuid())
  userId      String
  symbol      String
  type        String   // 'price', 'volume', 'news'
  condition   String   // e.g., 'above', 'below'
  value       Float
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([symbol])
}
```
