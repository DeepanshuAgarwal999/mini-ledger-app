import { type RequestHandler, Router } from 'express';
import { parse } from '../../lib/validate.js';
import { currentUser } from '../../middleware/auth.js';
import { requestOtpSchema, verifyOtpSchema } from './auth.schema.js';
import type { AuthService } from './auth.service.js';

export function authRoutes(service: AuthService, authenticate: RequestHandler): Router {
  const router = Router();

  router.post('/otp/request', async (req, res) => {
    const { phone } = parse(requestOtpSchema, req.body);
    const result = await service.requestOtp(phone);
    res.json({ message: 'OTP sent', phone, ...result });
  });

  router.post('/otp/verify', async (req, res) => {
    const { phone, code } = parse(verifyOtpSchema, req.body);
    res.json(await service.verifyOtp(phone, code));
  });

  router.get('/me', authenticate, (req, res) => {
    res.json({ user: currentUser(req) });
  });

  return router;
}
