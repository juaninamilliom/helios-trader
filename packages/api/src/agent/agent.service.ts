import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { DynamicTool } from '@langchain/core/tools';
import { AgentExecutor, createReactAgent } from 'langchain/agents';
import type { Runnable } from '@langchain/core/runnables';
import { pull } from 'langchain/hub';
import { type ChatPromptTemplate } from '@langchain/core/prompts';
import {
  AlpacaService,
  type Account,
  OrderSide,
  type Order,
} from '../alpaca/alpaca.service';
import {
  MarketDataService,
  type TrendingCoin,
} from '../market-data/market-data.service';
import {
  SentimentService,
  type SentimentResult,
} from '../sentiment/sentiment.service';
import { RiskService, type RiskAssessment } from '../risk/risk.service';
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
   * @method executeCryptoTrade
   * @description Executes a crypto trade based on symbol, side, and quantity
   * @param {string} symbol - The crypto trading pair (e.g., 'BTC/USD')
   * @param {OrderSide} side - Buy or sell
   * @param {string} [qty] - Quantity to trade
   * @param {string} [notional] - Notional amount to trade
   * @param {number} [stopLossPercentage=5] - Percentage for stop loss
   * @param {number} [takeProfitPercentage=10] - Percentage for take profit
   * @returns {Promise<{success: boolean, message: string, orders?: {primary: Order, stopLoss?: Order, takeProfit?: Order}}>} Trade execution result
   */
  async executeCryptoTrade(
    symbol: string,
    side: OrderSide,
    qty?: string,
    notional?: string,
    stopLossPercentage = 5,
    takeProfitPercentage = 10,
  ): Promise<{
    success: boolean;
    message: string;
    orders?: {
      primary: Order;
      stopLoss?: Order;
      takeProfit?: Order;
    };
  }> {
    try {
      if (!symbol) {
        return { success: false, message: 'Symbol is required' };
      }

      if (!qty && !notional) {
        return {
          success: false,
          message: 'Either quantity or notional amount is required',
        };
      }

      // Format symbol if needed (ensure it has the /USD format)
      if (!symbol.includes('/')) {
        symbol = `${symbol}/USD`;
      }

      this.logger.log(
        `Executing ${side} trade for ${symbol} with ${qty || notional}`,
      );

      // Execute the trade with risk management
      const result =
        await this.alpacaService.executeCryptoTradeWithRiskManagement(
          symbol,
          side,
          qty || '',
          stopLossPercentage,
          takeProfitPercentage,
        );

      return {
        success: true,
        message: `Successfully executed ${side} trade for ${symbol}`,
        orders: {
          primary: result.primaryOrder,
          stopLoss: result.stopLoss,
          takeProfit: result.takeProfit,
        },
      };
    } catch (err: unknown) {
      const error = ensureError(err);
      const errorMessage = `Failed to execute trade: ${error.message}`;
      this.logger.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  }

  /**
   * @private
   * @method generateTradeRecommendation
   * @description Generates a trade recommendation based on sentiment and risk analysis
   * @param {SentimentResult} sentiment - The sentiment analysis result
   * @param {RiskAssessment} risk - The risk assessment result
   * @returns {string} A trade recommendation (buy, hold, sell, avoid)
   */
  private generateTradeRecommendation(
    sentiment: SentimentResult,
    risk: RiskAssessment,
  ): string {
    // Calculate a combined score based on sentiment and risk
    // Sentiment score ranges from -1 to 1, higher is better
    // Risk score ranges from 0 to 100, lower is better

    // Normalize risk score to 0-1 range (inverted so higher is better)
    const normalizedRisk = (100 - risk.riskScore) / 100;

    // Adjust sentiment to 0-1 range
    const normalizedSentiment = (sentiment.score + 1) / 2;

    // Weight sentiment and risk (can be adjusted based on preference)
    const sentimentWeight = 0.6;
    const riskWeight = 0.4;

    // Calculate combined score (0-1 range)
    const combinedScore =
      normalizedSentiment * sentimentWeight + normalizedRisk * riskWeight;

    // Generate recommendation based on score
    if (combinedScore >= 0.8) {
      return 'strong_buy';
    } else if (combinedScore >= 0.6) {
      return 'buy';
    } else if (combinedScore >= 0.4) {
      return 'hold';
    } else if (combinedScore >= 0.2) {
      return 'sell';
    } else {
      return 'avoid';
    }
  }

  /**
   * @constructor
   * @param {ConfigService} configService - NestJS ConfigService for accessing environment variables.
   * @param {AlpacaService} alpacaService - Service for interacting with the Alpaca API.
   */
  constructor(
    private configService: ConfigService,
    private alpacaService: AlpacaService,
    private marketDataService: MarketDataService,
    private sentimentService: SentimentService,
    private riskService: RiskService,
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

      const getTrendingCoinsTool = new DynamicTool({
        name: 'getTrendingCoins',
        description:
          'Returns a list of currently trending coins from CoinGecko.',
        func: async () => {
          try {
            const coins: TrendingCoin[] =
              await this.marketDataService.getTrendingCoins();
            return JSON.stringify(coins);
          } catch (err: unknown) {
            const error = ensureError(err);
            const errorMessage = `Failed to get trending coins: ${error.message}`;
            this.logger.error(`Error in getTrendingCoinsTool: ${errorMessage}`);
            return JSON.stringify({ error: errorMessage });
          }
        },
      });

      const getSentimentTool = new DynamicTool({
        name: 'getSentiment',
        description:
          'Analyzes social media sentiment for a cryptocurrency. Provide the symbol (e.g., "BTC", "PEPE").',
        func: async (symbol: string) => {
          try {
            if (!symbol) {
              return JSON.stringify({ error: 'Symbol is required' });
            }

            const sentiment: SentimentResult =
              await this.sentimentService.getSentiment(symbol);
            return JSON.stringify(sentiment);
          } catch (err: unknown) {
            const error = ensureError(err);
            const errorMessage = `Failed to get sentiment data: ${error.message}`;
            this.logger.error(`Error in getSentimentTool: ${errorMessage}`);
            return JSON.stringify({ error: errorMessage });
          }
        },
      });

      const assessRiskTool = new DynamicTool({
        name: 'assessRisk',
        description:
          'Performs on-chain risk assessment for a cryptocurrency. Provide the symbol and optionally the contract address and blockchain.',
        func: async (input: string) => {
          try {
            // Parse the input as JSON
            let params: {
              symbol: string;
              contractAddress?: string;
              blockchain?: string;
            };
            try {
              params = JSON.parse(input);
            } catch {
              // If not valid JSON, assume it's just the symbol
              params = { symbol: input };
            }

            if (!params.symbol) {
              return JSON.stringify({ error: 'Symbol is required' });
            }

            const risk: RiskAssessment = await this.riskService.assessRisk(
              params.symbol,
              params.contractAddress,
              params.blockchain,
            );
            return JSON.stringify(risk);
          } catch (err: unknown) {
            const error = ensureError(err);
            const errorMessage = `Failed to assess risk: ${error.message}`;
            this.logger.error(`Error in assessRiskTool: ${errorMessage}`);
            return JSON.stringify({ error: errorMessage });
          }
        },
      });

      const analyzeCoinTool = new DynamicTool({
        name: 'analyzeCoin',
        description:
          'Comprehensive analysis of a cryptocurrency, including market data, sentiment, and risk assessment. Provide the symbol.',
        func: async (symbol: string) => {
          try {
            if (!symbol) {
              return JSON.stringify({ error: 'Symbol is required' });
            }

            // Get data from all services in parallel
            const [sentiment, risk] = await Promise.all([
              this.sentimentService.getSentiment(symbol),
              this.riskService.assessRisk(symbol),
            ]);

            // Combine the data
            const analysis = {
              symbol,
              name: sentiment.name,
              sentiment,
              risk,
              recommendation: this.generateTradeRecommendation(sentiment, risk),
              timestamp: new Date(),
            };

            return JSON.stringify(analysis);
          } catch (err: unknown) {
            const error = ensureError(err);
            const errorMessage = `Failed to analyze coin: ${error.message}`;
            this.logger.error(`Error in analyzeCoinTool: ${errorMessage}`);
            return JSON.stringify({ error: errorMessage });
          }
        },
      });

      // Tool for executing trades based on analysis
      const executeTradeTool = new DynamicTool({
        name: 'executeTrade',
        description:
          'Execute a crypto trade with specified parameters. Provide JSON with symbol, side (buy/sell), and either qty or notional.',
        func: async (input: string) => {
          try {
            // Parse the input as JSON
            let params: {
              symbol: string;
              side: OrderSide;
              qty?: string;
              notional?: string;
              stopLossPercentage?: number;
              takeProfitPercentage?: number;
            };

            try {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              params = JSON.parse(input);
            } catch {
              return JSON.stringify({
                error:
                  'Invalid JSON input. Please provide valid JSON with symbol, side, and qty/notional.',
              });
            }

            if (!params.symbol) {
              return JSON.stringify({ error: 'Symbol is required' });
            }

            if (!params.side || !['buy', 'sell'].includes(params.side)) {
              return JSON.stringify({
                error: 'Valid side (buy or sell) is required',
              });
            }

            if (!params.qty && !params.notional) {
              return JSON.stringify({
                error: 'Either qty or notional is required',
              });
            }

            const result = await this.executeCryptoTrade(
              params.symbol,
              params.side,
              params.qty,
              params.notional,
              params.stopLossPercentage,
              params.takeProfitPercentage,
            );

            return JSON.stringify(result);
          } catch (err: unknown) {
            const error = ensureError(err);
            const errorMessage = `Failed to execute trade: ${error.message}`;
            this.logger.error(`Error in executeTradeTool: ${errorMessage}`);
            return JSON.stringify({ error: errorMessage });
          }
        },
      });

      await this.initializeAgent([
        getAccountInfoTool,
        getTrendingCoinsTool,
        getSentimentTool,
        assessRiskTool,
        analyzeCoinTool,
        executeTradeTool,
      ]);
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
   * @param {DynamicTool[]} tools - Array of tools for the agent to use.
   * @returns {Promise<void>} A promise that resolves when the agent is initialized.
   */
  private async initializeAgent(tools: DynamicTool[]): Promise<void> {
    try {
      const model = this.model;
      if (!model) {
        throw new Error('Model not initialized');
      }

      const promptTemplate = await pull<ChatPromptTemplate>('hwchase17/react');

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
