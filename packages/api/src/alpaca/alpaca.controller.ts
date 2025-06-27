import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthenticatedGuard } from '../auth/authenticated.guard';

@Controller('alpaca')
export class AlpacaController {
  @Get('protected')
  @UseGuards(AuthenticatedGuard)
  /**
   * A protected route that requires authentication.
   * It returns a welcome message to the authenticated user.
   * @param req - The request object from Express, containing the user's information.
   * @returns An object with a welcome message.
   */
  getProtected(@Req() req: { user?: { email?: string } }) {
    return {
      message: `Hello, ${req.user?.email || 'user'}! You are authenticated.`,
    };
  }
}
