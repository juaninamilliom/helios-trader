import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';

describe('AgentController', () => {
  let controller: AgentController;
  let agentService: AgentService;

  beforeEach(async () => {
    const mockAgentService = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentController],
      providers: [
        {
          provide: AgentService,
          useValue: mockAgentService,
        },
      ],
    }).compile();

    controller = module.get<AgentController>(AgentController);
    agentService = module.get<AgentService>(AgentService);

    // Mock logger to prevent console output during tests
    jest.spyOn(controller['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(controller['logger'], 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('query', () => {
    it('should return a response from the agent service', async () => {
      const queryDto = { query: 'What is my account balance?' };
      const expectedResponse = 'Your account balance is $10,000';
      
      jest.spyOn(agentService, 'query').mockResolvedValue(expectedResponse);
      
      const result = await controller.query(queryDto);
      
      expect(agentService.query).toHaveBeenCalledWith(queryDto.query);
      expect(result).toEqual({ response: expectedResponse });
    });

    it('should throw HttpException when agent service throws an error', async () => {
      const queryDto = { query: 'What is my account balance?' };
      const errorMessage = 'Service unavailable';
      
      jest.spyOn(agentService, 'query').mockRejectedValue(new Error(errorMessage));
      
      await expect(controller.query(queryDto)).rejects.toThrow(
        new HttpException(
          `Failed to process query: ${errorMessage}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('health', () => {
    it('should return a health status', async () => {
      const result = await controller.health();
      
      expect(result).toEqual({
        status: 'ok',
        message: 'Agent service is running',
      });
    });

    it('should throw HttpException when health check fails', async () => {
      // Mock Promise.resolve to throw an error for this test
      jest.spyOn(Promise, 'resolve').mockRejectedValueOnce(new Error('Health check failed'));
      
      await expect(controller.health()).rejects.toThrow(
        new HttpException(
          'Service unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        ),
      );
    });
  });
});
