import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      name: 'Helios Trader API',
      description: 'Backend API for the Helios Meme Coin Trading Bot',
      version: '1.0.0',
      status: 'online',
      endpoints: {
        '/auth/google': 'Google OAuth login',
        '/auth/status': 'Check authentication status',
        '/auth/logout': 'Logout current user',
        '/agent': 'Agent interaction endpoints',
        '/market-data': 'Market data endpoints',
        '/sentiment': 'Sentiment analysis endpoints',
        '/risk': 'Risk assessment endpoints',
      },
      documentation:
        'See README files in each service directory for detailed API documentation',
    };
  }
}
