
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AlpacaService, Account, Position } from './alpaca.service';
import { PrismaService } from '../prisma/prisma.service';
import Alpaca from '@alpacahq/alpaca-trade-api';

const mockGetAccount = jest.fn();
const mockGetPositions = jest.fn();
const mockGetPosition = jest.fn();

// Mock the Alpaca library with a factory that handles default export
jest.mock('@alpacahq/alpaca-trade-api', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return {
        getAccount: mockGetAccount,
        getPositions: mockGetPositions,
        getPosition: mockGetPosition,
      };
    }),
  };
});

const mockedAlpaca = Alpaca as jest.Mock;

describe('AlpacaService', () => {
  let service: AlpacaService;

  const mockAccount: Account = {
    id: 'test-account-id',
    status: 'ACTIVE',
    currency: 'USD',
    buying_power: '100000',
    equity: '100000',
    portfolio_value: '100000',
    account_number: '',
    regt_buying_power: '',
    daytrading_buying_power: '',
    cash: '',
    pattern_day_trader: false,
    trading_blocked: false,
    transfers_blocked: false,
    account_blocked: false,
    created_at: '',
    trade_suspended_by_user: false,
    multiplier: '',
    shorting_enabled: false,
    last_equity: '',
    long_market_value: '',
    short_market_value: '',
    initial_margin: '',
    maintenance_margin: '',
    last_maintenance_margin: '',
    sma: '',
    daytrade_count: 0,
  };

  const mockPosition: Position = {
    asset_id: 'test-asset-id',
    symbol: 'AAPL',
    qty: '10',
    side: 'long',
    market_value: '1500',
    cost_basis: '1400',
    unrealized_pl: '100',
  };

  const setup = async (env: Record<string, string>) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlpacaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => env[key]),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AlpacaService>(AlpacaService);
    // Spy on logger methods to prevent console output during tests
    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'warn').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
  };

  beforeEach(() => {
    // Clear all mocks and restore spies before each test
    mockedAlpaca.mockClear();
    mockGetAccount.mockClear();
    mockGetPositions.mockClear();
    mockGetPosition.mockClear();
    jest.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should throw an error if API key is missing', async () => {
      await expect(setup({ ALPACA_SECRET_KEY: 'secret' })).rejects.toThrow(
        'Alpaca API credentials are missing. Please check your environment variables.',
      );
    });

    it('should throw an error if secret key is missing', async () => {
      await expect(setup({ ALPACA_API_KEY: 'key' })).rejects.toThrow(
        'Alpaca API credentials are missing. Please check your environment variables.',
      );
    });

    it('should initialize correctly with valid keys', async () => {
      await setup({ ALPACA_API_KEY: 'key', ALPACA_SECRET_KEY: 'secret' });
      expect(service).toBeDefined();
      expect(mockedAlpaca).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if ConfigService is not available', () => {
      expect(() => new AlpacaService(null as any, null as any)).toThrow(
        'ConfigService is not available',
      );
    });
  });

  describe('onModuleInit', () => {
    it('should log account ID on successful initialization', async () => {
      mockGetAccount.mockResolvedValue(mockAccount);
      await setup({ ALPACA_API_KEY: 'key', ALPACA_SECRET_KEY: 'secret' });
      const loggerLogSpy = jest.spyOn(service['logger'], 'log');
      await service.onModuleInit();
      expect(loggerLogSpy).toHaveBeenCalledWith(
        `Successfully connected to Alpaca. Account ID: ${mockAccount.id}`,
      );
    });

    it('should log an error if initialization fails', async () => {
      mockGetAccount.mockRejectedValue(new Error('Initialization failed'));
      await setup({ ALPACA_API_KEY: 'key', ALPACA_SECRET_KEY: 'secret' });
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');
      await service.onModuleInit();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Error initializing Alpaca service: Alpaca API Error: Initialization failed',
      );
    });
  });

  describe('Service Methods', () => {
    beforeEach(async () => {
      await setup({ ALPACA_API_KEY: 'key', ALPACA_SECRET_KEY: 'secret' });
    });

    describe('getAccountInfo', () => {
      it('should return account info successfully', async () => {
        mockGetAccount.mockResolvedValue(mockAccount);
        const result = await service.getAccountInfo();
        expect(result).toEqual(mockAccount);
      });

      it('should throw an error for invalid account data', async () => {
        mockGetAccount.mockResolvedValue({ id: '123' }); // Invalid data
        await expect(service.getAccountInfo()).rejects.toThrow(
          'Alpaca API Error: Received invalid account data from Alpaca.',
        );
      });

      it('should throw an error for null account data', async () => {
        mockGetAccount.mockResolvedValue(null);
        await expect(service.getAccountInfo()).rejects.toThrow(
          'Alpaca API Error: Received invalid account data from Alpaca.',
        );
      });

      it('should throw an error if alpaca call fails', async () => {
        mockGetAccount.mockRejectedValue(new Error('API Down'));
        await expect(service.getAccountInfo()).rejects.toThrow(
          'Alpaca API Error: API Down',
        );
      });
    });

    describe('getPositions', () => {
      it('should return positions successfully', async () => {
        mockGetPositions.mockResolvedValue([mockPosition]);
        const result = await service.getPositions();
        expect(result).toEqual([mockPosition]);
      });

      it('should throw an error for invalid positions data', async () => {
        mockGetPositions.mockResolvedValue([{ symbol: 'FAIL' }]);
        await expect(service.getPositions()).rejects.toThrow(
          'Alpaca API Error: Received invalid positions data from Alpaca.',
        );
      });

      it('should throw an error for null in positions array', async () => {
        mockGetPositions.mockResolvedValue([null]);
        await expect(service.getPositions()).rejects.toThrow(
          'Alpaca API Error: Received invalid positions data from Alpaca.',
        );
      });
    });

    describe('getPosition', () => {
      it('should return a position successfully', async () => {
        mockGetPosition.mockResolvedValue(mockPosition);
        const result = await service.getPosition('AAPL');
        expect(result).toEqual(mockPosition);
      });

      it('should return null if position is not found (404)', async () => {
        const error = { statusCode: 404, message: 'position not found' };
        mockGetPosition.mockRejectedValue(error);
        const result = await service.getPosition('MSFT');
        expect(result).toBeNull();
      });

      it('should return null for invalid position data and log a warning', async () => {
        mockGetPosition.mockResolvedValue({ symbol: 'FAIL' }); // Invalid data
        const loggerWarnSpy = jest.spyOn(service['logger'], 'warn');
        const result = await service.getPosition('FAIL');
        expect(result).toBeNull();
        expect(loggerWarnSpy).toHaveBeenCalledWith(
          'Invalid position data received for symbol: FAIL',
        );
      });

      it('should throw an error for other API errors', async () => {
        const error = new Error('Internal Server Error');
        mockGetPosition.mockRejectedValue(error);
        await expect(service.getPosition('GOOG')).rejects.toThrow(
          'Could not fetch position for GOOG from Alpaca: Internal Server Error',
        );
      });
    });
  });
});
