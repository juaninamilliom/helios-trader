import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Controller('authentication')
export class AuthenticationController {
  @Get('google')
  @UseGuards(AuthGuard('google'))
  /**
   * Initiates the Google OAuth2 login flow.
   * This endpoint redirects the user to Google's authentication page.
   * @param req - The request object from Express.
   */
  googleAuth(@Req() req) {
    // The @UseGuards(AuthGuard('google')) decorator handles the redirection.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  /**
   * Handles the callback from Google after successful authentication.
   * It receives the user's profile and redirects them to the dashboard.
   * @param req - The request object from Express, containing the user's profile.
   * @param res - The response object from Express, used to redirect the user.
   */
  googleAuthRedirect(@Req() req, @Res() res: Response) {
    // In a real app, you would implement session management and token generation here.
    res.redirect('http://localhost:3001/dashboard');
  }
}
