import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  INestApplication,
} from '@nestjs/common';
import {
  PrismaClient,
  Portfolio,
  Position,
  Trade,
  AgentDecision,
} from '@prisma/client';
import { ensureError } from '../utils/error-handling';

/**
 * Service for database operations using Prisma ORM.
 * Handles connections, transactions, and CRUD operations for all entities.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Creates an instance of PrismaService with logging configuration.
   */
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  /**
   * Lifecycle hook that runs when the module is initialized.
   * Establishes database connection and sets up query logging.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to database...');
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (err: unknown) {
      const error = ensureError(err);
      this.logger.error(`Failed to connect to database: ${error.message}`);
      throw new Error(`Database connection failed: ${error.message}`);
    }

    // Log query performance in development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug('Query logging enabled for development');
    }
  }

  /**
   * Lifecycle hook that runs when the module is being destroyed.
   * Closes database connection gracefully.
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
  }

  /**
   * Setup shutdown hooks for graceful shutdown.
   * @param app - NestJS application instance.
   */
  enableShutdownHooks(app: INestApplication): void {
    process.on('beforeExit', () => {
      this.logger.log('Shutting down PrismaService...');
      Promise.resolve(app.close()).catch((err: unknown) => {
        const error = ensureError(err);
        this.logger.error(`Error during app shutdown: ${error.message}`);
      });
    });
  }

  /**
   * Creates a new portfolio record.
   * @param data - Portfolio creation data.
   * @returns Promise resolving to the created Portfolio.
   */
  async createPortfolio(data: {
    brokerage?: string;
    accountNumber: string;
  }): Promise<Portfolio> {
    return await this.portfolio.create({ data });
  }

  /**
   * Retrieves a portfolio by its ID.
   * @param id - Portfolio ID.
   * @returns Promise resolving to the Portfolio or null if not found.
   */
  async getPortfolio(id: number): Promise<Portfolio | null> {
    return await this.portfolio.findUnique({
      where: { id },
      include: { positions: true },
    });
  }

  /**
   * Retrieves a portfolio by account number.
   * @param accountNumber - Alpaca account number.
   * @returns Promise resolving to the Portfolio or null if not found.
   */
  async getPortfolioByAccountNumber(
    accountNumber: string,
  ): Promise<Portfolio | null> {
    return await this.portfolio.findUnique({
      where: { accountNumber },
      include: { positions: true },
    });
  }

  /**
   * Updates an existing portfolio.
   * @param id - Portfolio ID.
   * @param data - Portfolio update data.
   * @returns Promise resolving to the updated Portfolio.
   */
  async updatePortfolio(
    id: number,
    data: {
      brokerage?: string;
      accountNumber?: string;
    },
  ): Promise<Portfolio> {
    return await this.portfolio.update({
      where: { id },
      data,
    });
  }

  /**
   * Creates a new position record.
   * @param data - Position creation data.
   * @returns Promise resolving to the created Position.
   */
  async createPosition(data: {
    symbol: string;
    quantity: number;
    averageEntryPrice: number;
    portfolioId: number;
  }): Promise<Position> {
    return await this.position.create({ data });
  }

  /**
   * Retrieves a position by its ID.
   * @param id - Position ID.
   * @returns Promise resolving to the Position or null if not found.
   */
  async getPosition(id: number): Promise<Position | null> {
    return await this.position.findUnique({
      where: { id },
      include: { trades: true },
    });
  }

  /**
   * Retrieves a position by portfolio ID and symbol.
   * @param portfolioId - Portfolio ID.
   * @param symbol - Stock symbol.
   * @returns Promise resolving to the Position or null if not found.
   */
  async getPositionBySymbol(
    portfolioId: number,
    symbol: string,
  ): Promise<Position | null> {
    return await this.position.findUnique({
      where: {
        portfolioId_symbol: {
          portfolioId,
          symbol,
        },
      },
      include: { trades: true },
    });
  }

  /**
   * Updates an existing position.
   * @param id - Position ID.
   * @param data - Position update data.
   * @returns Promise resolving to the updated Position.
   */
  async updatePosition(
    id: number,
    data: {
      symbol?: string;
      quantity?: number;
      averageEntryPrice?: number;
    },
  ): Promise<Position> {
    return await this.position.update({
      where: { id },
      data,
    });
  }

  /**
   * Retrieves all positions for a specific portfolio.
   * @param portfolioId - Portfolio ID.
   * @returns Promise resolving to an array of Positions.
   */
  async getPositionsByPortfolio(portfolioId: number): Promise<Position[]> {
    return await this.position.findMany({
      where: { portfolioId },
      include: { trades: true },
    });
  }

  /**
   * Creates a new trade record.
   * @param data - Trade creation data.
   * @returns Promise resolving to the created Trade.
   */
  async createTrade(data: {
    orderId: string;
    symbol: string;
    side: string;
    qty: number;
    price: number;
    positionId: number;
    agentDecisionId?: number;
  }): Promise<Trade> {
    return await this.trade.create({ data });
  }

  /**
   * Retrieves a trade by its ID.
   * @param id - Trade ID.
   * @returns Promise resolving to the Trade or null if not found.
   */
  async getTrade(id: number): Promise<Trade | null> {
    return await this.trade.findUnique({
      where: { id },
      include: { position: true, agentDecision: true },
    });
  }

  /**
   * Retrieves all trades for a specific position.
   * @param positionId - Position ID.
   * @returns Promise resolving to an array of Trades.
   */
  async getTradesByPosition(positionId: number): Promise<Trade[]> {
    return await this.trade.findMany({
      where: { positionId },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Creates a new agent decision record.
   * @param data - AgentDecision creation data.
   * @returns Promise resolving to the created AgentDecision.
   */
  async createAgentDecision(data: {
    input: string;
    reasoning: string;
    action: string;
  }): Promise<AgentDecision> {
    return await this.agentDecision.create({ data });
  }

  /**
   * Retrieves an agent decision by its ID.
   * @param id - AgentDecision ID.
   * @returns Promise resolving to the AgentDecision or null if not found.
   */
  async getAgentDecision(id: number): Promise<AgentDecision | null> {
    return await this.agentDecision.findUnique({
      where: { id },
      include: { executedTrade: true },
    });
  }

  /**
   * Retrieves the most recent agent decisions.
   * @param limit - Maximum number of decisions to retrieve (default: 10).
   * @returns Promise resolving to an array of AgentDecisions.
   */
  async getRecentAgentDecisions(limit = 10): Promise<AgentDecision[]> {
    return await this.agentDecision.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: { executedTrade: true },
    });
  }
}
