import {
  Controller,
  Post,
  Body,
  Get,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AgentService } from './agent.service';

interface QueryDto {
  query: string;
}

@Controller('agent')
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  /**
   * Creates an instance of AgentController.
   * @param {AgentService} agentService - The service that handles the agent's logic.
   */
  constructor(private readonly agentService: AgentService) {}

  @Post('query')
  /**
   * Processes a natural language query through the agent.
   * @param {QueryDto} queryDto - The data transfer object containing the user's query.
   * @returns {Promise<{ response: string }>} A promise that resolves with the agent's response.
   */
  async query(@Body() queryDto: QueryDto) {
    try {
      this.logger.log(`Received query: ${queryDto.query}`);
      const response = await this.agentService.query(queryDto.query);
      return { response };
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(`Error processing query: ${error.message}`);
      throw new HttpException(
        `Failed to process query: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  /**
   * Checks the health of the agent service.
   * @returns {Promise<{ status: string, message: string }>} A promise that resolves with the health status.
   */
  async health() {
    try {
      // Simple health check that could be expanded to check dependencies
      await Promise.resolve();
      return { status: 'ok', message: 'Agent service is running' };
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(`Health check failed: ${error.message}`);
      throw new HttpException(
        'Service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
