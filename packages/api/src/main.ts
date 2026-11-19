import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as passport from 'passport';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(
    session({
      secret: configService.get<string>('SESSION_SECRET')!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 3600000, // 1 hour
        httpOnly: true,
        sameSite: 'lax', // Standard for modern browsers, allows cookies on top-level navigation
        secure: false, // Must be false for HTTP
        path: '/',
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Enable CORS for frontend communication
  const frontendUrls = [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:3000', // Allow requests from default Next.js port during transition
  ];
  app.enableCors({
    origin: frontendUrls, // Your frontend URLs
    credentials: true,
  });
  console.log(`CORS enabled for origins: ${frontendUrls.join(', ')}`);

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap().catch((err) => {
  console.error('Error starting the application:', err);
  process.exit(1);
});
