import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { DynamicTool } from '@langchain/core/tools';
import { AgentExecutor, createReactAgent } from 'langchain/agents';
import type { Runnable } from '@langchain/core/runnables';
import { pull } from 'langchain/hub';
import { type ChatPromptTemplate } from '@langchain/core/prompts';
import { AlpacaService, type Account } from '../alpaca/alpaca.service';
import { ensureError } from '../utils/error-handling';

/**
 * @class AgentService
 * @description Service responsible for AI agent operations, including interacting
 * with LangChain and the Alpaca API to process user queries and execute tasks.
 */
@Injectable()
export class AgentService implements OnModuleInit {
  private readonly logger = new Logger(AgentService.name);
  private model: ChatOpenAI | null = null;
  private agentExecutor: AgentExecutor | null = null;

  /**
   * @constructor
   * @param {ConfigService} configService - NestJS ConfigService for accessing environment variables.
   * @param {AlpacaService} alpacaService - Service for interacting with the Alpaca API.
   */
  constructor(
    private configService: ConfigService,
    private alpacaService: AlpacaService,
  ) {}

  /**
   * @method onModuleInit
   * @description Initializes the agent when the module is loaded.
   */
  async onModuleInit() {
    try {
      await this.setupAgent();
    } catch (err: unknown) {
      const error = ensureError(err);
      this.logger.error(
        `FATAL: Failed to setup agent on module init: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * @private
   * @method setupAgent
   * @description Sets up the AI agent, initializing the language model and creating necessary tools.
   * @returns {Promise<void>} A promise that resolves when the agent is set up.
   */
  private async setupAgent(): Promise<void> {
    try {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!apiKey) {
        throw new Error('OpenAI API key is missing');
      }

      this.model = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: 'gpt-4',
        temperature: 0,
      });

      const getAccountInfoTool = new DynamicTool({
        name: 'getAccountInfo',
        description:
          "Returns the user's trading account details, including buying power, portfolio value, and profit or loss.",
        func: async () => {
          try {
            const account: Account = await this.alpacaService.getAccountInfo();

            const equity = parseFloat(account.equity);
            const lastEquity = parseFloat(account.last_equity);
            const profitLoss =
              !isNaN(equity) && !isNaN(lastEquity) ? equity - lastEquity : 0;

            return JSON.stringify({
              buying_power: account.buying_power,
              portfolio_value: account.portfolio_value,
              equity: account.equity,
              profit_loss: profitLoss.toString(),
            });
          } catch (err: unknown) {
            const error = ensureError(err);
            this.logger.error(`Error in getAccountInfoTool: ${error.message}`);
            return JSON.stringify({
              error: `Failed to get account info: ${error.message}`,
            });
          }
        },
      });

      await this.initializeAgent(getAccountInfoTool);
    } catch (err: unknown) {
      const error = ensureError(err);
      this.logger.error(`Error setting up agent: ${error.message}`);
      throw new Error(`Failed to setup agent: ${error.message}`);
    }
  }

  /**
   * @private
   * @method initializeAgent
   * @description Initializes the agent executor with tools and a prompt template from LangChain Hub.
   * @param {DynamicTool} getAccountInfoTool - The tool for retrieving account information.
   * @returns {Promise<void>} A promise that resolves when the agent is initialized.
   */
  private async initializeAgent(
    getAccountInfoTool: DynamicTool,
  ): Promise<void> {
    try {
      const model = this.model;
      if (!model) {
        throw new Error('Model not initialized');
      }

      const promptTemplate = await pull<ChatPromptTemplate>('hwchase17/react');
      const tools = [getAccountInfoTool];

      const agent: Runnable = await createReactAgent({
        llm: model,
        tools,
        prompt: promptTemplate,
      });

      this.agentExecutor = new AgentExecutor({
        agent,
        tools,
      });
    } catch (err: unknown) {
      const error = ensureError(err);
      this.logger.error(`Error initializing agent: ${error.message}`);
      throw new Error(`Failed to initialize agent: ${error.message}`);
    }
  }

  /**
   * @method query
   * @description Processes a user query through the AI agent and returns the result.
   * @param {string} input - The user's text query.
   * @returns {Promise<string>} A promise that resolves to the agent's response as a string.
   */
  async query(input: string): Promise<string> {
    this.logger.log(`Processing query: ${input}`);
    const executor = this.agentExecutor;

    if (!executor) {
      this.logger.error('Agent is not initialized. Cannot process query.');
      return 'The AI agent is not ready. Please try again later.';
    }

    try {
      const response: unknown = await executor.invoke({ input });

      if (
        response &&
        typeof response === 'object' &&
        'output' in response &&
        typeof response.output === 'string'
      ) {
        return response.output;
      }

      this.logger.warn(
        'Agent response is not in the expected format.',
        response,
      );
      return 'The agent returned a response in an unexpected format.';
    } catch (err: unknown) {
      const error = ensureError(err);
      this.logger.error(`Error processing query: ${error.message}`);
      return `An error occurred while processing your query: ${error.message}`;
    }
  }
}
