import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { Session } from 'express-session';

@Controller('authentication')
export class AuthenticationController {
  @Get('google')
  @UseGuards(AuthGuard('google'))
  /**
   * Initiates the Google OAuth2 login flow.
   * This endpoint redirects the user to Google's authentication page.
   * @param req - The request object from Express.
   */
  googleAuth() {
    // The @UseGuards(AuthGuard('google')) decorator handles the redirection.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  /**
   * It receives the user's profile and redirects them to the chat page.
   * @param req - The request object from Express, containing the user's profile.
   * @param res - The response object from Express, used to redirect the user.
   */
  googleAuthRedirect(
    @Req()
    req: Request & {
      isAuthenticated?: () => boolean;
      user?: Record<string, unknown>;
      session?: Session & { id?: string };
    },
    @Res() res: Response,
  ) {
    // In a real app, you would implement session management and token generation here.
    console.log('User authenticated:', req.user);
    console.log('Session ID:', req.session?.id ?? 'no-session-id');
    console.log(
      'Is authenticated in callback:',
      req.isAuthenticated?.() ?? false,
    );

    // Set a cookie to help debug
    res.cookie('auth_debug', 'true', {
      maxAge: 900000,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    });

    res.redirect('http://localhost:3001/chat');
  }

  @Get('status')
  status(
    @Req()
    req: Request & {
      isAuthenticated?: () => boolean;
      user?: Record<string, unknown>;
      session?: Session & { id?: string };
    },
  ) {
    // Check if the user is authenticated
    const isAuthenticated = req.isAuthenticated ? req.isAuthenticated() : false;
    console.log('Auth status check:', isAuthenticated);
    console.log('Session ID in status:', req.session?.id || 'no-session-id');
    console.log('Session data:', req.session);
    console.log('User in request:', req.user);
    console.log('Cookies:', req.headers.cookie);

    return {
      isAuthenticated,
      user: isAuthenticated ? req.user : null,
      sessionId: req.session?.id || 'no-session-id',
    };
  }
}
