import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';

@Controller('authentication')
export class AuthenticationController {
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    if (!req.user)
      throw new UnauthorizedException(
        'Google authentication did not return a user',
      );
    // Passport rotates, serializes and saves the login session before this callback completes.
    await new Promise<void>((resolve, reject) => {
      req.logIn(req.user!, { session: true }, (error) =>
        error
          ? reject(
              error instanceof Error ? error : new Error('Session save failed'),
            )
          : resolve(),
      );
    });
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3001'}/connected`,
    );
  }

  @Get('status')
  status(@Req() req: Request & { user?: unknown }) {
    const isAuthenticated = req.isAuthenticated ? req.isAuthenticated() : false;
    return { isAuthenticated, user: isAuthenticated ? req.user : null };
  }

  @Post('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    if (
      req.get('origin') !==
      new URL(process.env.FRONTEND_URL || 'http://localhost:3001').origin
    )
      throw new ForbiddenException('Mutation origin is not allowed');
    req.logout((err) => {
      if (err) {
        res.status(500).json({ message: 'Sign out failed' });
        return;
      }
      req.session.destroy((error) => {
        if (error) {
          res.status(500).json({ message: 'Sign out failed' });
          return;
        }
        res.clearCookie('helios.sid', { path: '/' });
        res.json({ signedOut: true });
      });
    });
  }
}
