/* eslint-disable @typescript-eslint/unbound-method -- Jest inspects mock calls; these references are never invoked without their receiver. */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import {
  Portfolio,
  Position,
  Trade,
  AgentDecision,
  PrismaClient,
} from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

// Mock data
const mockPortfolioData: Portfolio = {
  id: 1,
  accountNumber: 'ACC123456',
  brokerage: 'Alpaca',
  createdAt: new Date(),
};
const mockPositionData: Position = {
  id: 1,
  symbol: 'AAPL',
  quantity: 10,
  averageEntryPrice: 150.0,
  createdAt: new Date(),
  updatedAt: new Date(),
  portfolioId: 1,
};
const mockTradeData: Trade = {
  id: 1,
  symbol: 'AAPL',
  side: 'buy',
  timestamp: new Date(),
  orderId: 'order-1',
  qty: 1,
  price: 150,
  positionId: 1,
  agentDecisionId: null,
};
const mockAgentDecisionData: AgentDecision = {
  id: 1,
  action: 'BUY',
  timestamp: new Date(),
  input: 'test',
  reasoning: 'fixture',
};

describe('PrismaService', () => {
  let service: PrismaService;
  let mockPrisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: PrismaClient, useValue: mockDeep<PrismaClient>() },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    mockPrisma = module.get(PrismaClient);
    Object.defineProperty(service, 'prisma', { value: mockPrisma });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Lifecycle Hooks', () => {
    it('onModuleInit should connect to the database', async () => {
      mockPrisma.$connect.mockResolvedValue();
      await service.onModuleInit();
      expect(mockPrisma.$connect).toHaveBeenCalled();
    });

    it('onModuleDestroy should disconnect from the database', async () => {
      mockPrisma.$disconnect.mockResolvedValue();
      await service.onModuleDestroy();
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });
  });

  describe('Portfolio', () => {
    it('should create a portfolio', async () => {
      const data = { accountNumber: 'ACC123', brokerage: 'Alpaca' };
      mockPrisma.portfolio.create.mockResolvedValue(mockPortfolioData);
      await service.createPortfolio(data);
      expect(mockPrisma.portfolio.create).toHaveBeenCalledWith({ data });
    });

    it('should get a portfolio by ID', async () => {
      mockPrisma.portfolio.findUnique.mockResolvedValue(mockPortfolioData);
      await service.getPortfolio(1);
      expect(mockPrisma.portfolio.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { positions: true },
      });
    });
  });

  describe('Position', () => {
    it('should create a position', async () => {
      const data = {
        symbol: 'TSLA',
        quantity: 5,
        averageEntryPrice: 200,
        portfolioId: 1,
      };
      mockPrisma.position.create.mockResolvedValue(mockPositionData);
      await service.createPosition(data);
      expect(mockPrisma.position.create).toHaveBeenCalledWith({ data });
    });

    it('should get positions by portfolio ID', async () => {
      mockPrisma.position.findMany.mockResolvedValue([mockPositionData]);
      await service.getPositionsByPortfolio(1);
      expect(mockPrisma.position.findMany).toHaveBeenCalledWith({
        where: { portfolioId: 1 },
        include: { trades: true },
      });
    });
  });

  describe('Trade', () => {
    it('should create a trade', async () => {
      const data = {
        orderId: 'order456',
        symbol: 'GOOG',
        side: 'sell',
        qty: 2,
        price: 1500,
        positionId: 2,
      };
      mockPrisma.trade.create.mockResolvedValue(mockTradeData);
      await service.createTrade(data);
      expect(mockPrisma.trade.create).toHaveBeenCalledWith({ data });
    });

    it('should get trades by position ID', async () => {
      mockPrisma.trade.findMany.mockResolvedValue([mockTradeData]);
      await service.getTradesByPosition(1);
      expect(mockPrisma.trade.findMany).toHaveBeenCalledWith({
        where: { positionId: 1 },
        orderBy: { timestamp: 'desc' },
      });
    });
  });

  describe('AgentDecision', () => {
    it('should create an agent decision', async () => {
      const data = {
        input: 'Is it time to sell?',
        reasoning: 'Market is volatile',
        action: 'HOLD',
      };
      mockPrisma.agentDecision.create.mockResolvedValue(mockAgentDecisionData);
      await service.createAgentDecision(data);
      expect(mockPrisma.agentDecision.create).toHaveBeenCalledWith({ data });
    });

    it('should get recent agent decisions', async () => {
      mockPrisma.agentDecision.findMany.mockResolvedValue([
        mockAgentDecisionData,
      ]);
      await service.getRecentAgentDecisions(5);
      expect(mockPrisma.agentDecision.findMany).toHaveBeenCalledWith({
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: { executedTrade: true },
      });
    });
  });
});
