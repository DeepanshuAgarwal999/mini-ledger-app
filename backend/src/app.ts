import cors from 'cors';
import express from 'express';
import type { AppConfig } from './config.js';
import type { Db } from './db/index.js';
import { type Clock, systemClock } from './lib/clock.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { createAuthService, logOtpSender, type OtpSender } from './modules/auth/auth.service.js';
import { loanRoutes } from './modules/loans/loans.routes.js';
import { createLoanService } from './modules/loans/loans.service.js';

export interface AppDeps {
  db: Db;
  config: Omit<AppConfig, 'port' | 'databaseUrl'>;
  clock?: Clock;
  sendOtp?: OtpSender;
}

export function createApp({ db, config, clock = systemClock, sendOtp = logOtpSender }: AppDeps) {
  const authenticate = requireAuth(config.jwtSecret);
  const authService = createAuthService({
    db,
    clock,
    sendOtp,
    jwtSecret: config.jwtSecret,
    jwtExpiresIn: config.jwtExpiresIn,
    otpTtlSeconds: config.otpTtlSeconds,
    otpMaxAttempts: config.otpMaxAttempts,
  });
  const loanService = createLoanService({ db, clock });

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', authRoutes(authService, authenticate));
  app.use('/api/loans', authenticate, loanRoutes(loanService, config));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
