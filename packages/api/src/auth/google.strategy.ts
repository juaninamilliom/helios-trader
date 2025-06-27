import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  /**
   * Creates an instance of GoogleStrategy.
   * @param {ConfigService} configService - Service for accessing configuration variables.
   * @param {AuthService} authService - Service for handling user authentication logic.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  /**
   * Validates the user based on the Google profile.
   * This method is called after the user is successfully authenticated with Google.
   * It receives the user's profile and tokens from Google.
   * @param {string} accessToken - The access token from Google.
   * @param {string} refreshToken - The refresh token from Google.
   * @param {any} profile - The user's profile information from Google.
   * @param {VerifyCallback} done - The callback to signal that validation is complete.
   * @returns {Promise<any>} A promise that resolves with the user object.
   */
  async validate(
    request: any, // request is passed because passReqToCallback is true
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = await this.authService.validateUser({
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
    });
    done(null, user);
  }
}
