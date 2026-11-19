import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as session from 'express-session';
import * as passport from 'passport';
import { FinanceModule } from './finance/finance.module';
import { FinanceDatabase } from './finance/database';
import { PostgresSessionStore } from './finance/session-store';
export function configureFinanceApp(app: INestApplication) {
  const config = app.get(ConfigService);
  const secret = config.get<string>('SESSION_SECRET');
  if (!secret || secret.length < 32)
    throw new Error('SESSION_SECRET must contain at least 32 characters');
  const production = config.get('NODE_ENV') === 'production';
  const origin = new URL(
    config.get<string>('FRONTEND_URL') || 'http://localhost:3001',
  ).origin;
  if (production && !origin.startsWith('https://'))
    throw new Error('Production FRONTEND_URL must use HTTPS');
  const express = app
    .getHttpAdapter()
    .getInstance() as import('express').Application;
  if (production) express.set('trust proxy', 1);
  app.use(
    (
      req: import('express').Request,
      res: import('express').Response,
      next: import('express').NextFunction,
    ) => {
      if (config.get('NODE_ENV') !== 'production') {
        res.on('finish', () => {
          const persisted = req.session as
            | (import('express-session').Session & {
                passport?: { user?: unknown };
              })
            | undefined;
          const route = req.route as { path?: unknown } | undefined;
          console.info(
            '[helios-http] ' +
              JSON.stringify({
                method: req.method,
                route:
                  typeof route?.path === 'string' ? route.path : 'unmatched',
                status: res.statusCode,
                requestAuthenticated: req.isAuthenticated?.() ?? false,
                sessionHasUser: !!persisted?.passport?.user,
              }),
          );
        });
      }
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      next();
    },
  );
  app.use(
    session({
      name: 'helios.sid',
      secret,
      resave: false,
      saveUninitialized: false,
      store: new PostgresSessionStore(app.get(FinanceDatabase)),
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: production,
        maxAge: 3600000,
      },
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.enableCors({ origin, credentials: true });
  app.enableShutdownHooks();
  return app;
}
export async function createFinanceApp() {
  return configureFinanceApp(await NestFactory.create(FinanceModule));
}
if (require.main === module) {
  void createFinanceApp()
    .then((app) =>
      app.listen(
        Number(process.env.PORT || 3003),
        process.env.HOST || '127.0.0.1',
      ),
    )
    .catch(() => {
      console.error(
        'Finance API startup failed. Check database connectivity, migrations and server configuration.',
      );
      process.exitCode = 1;
    });
}
