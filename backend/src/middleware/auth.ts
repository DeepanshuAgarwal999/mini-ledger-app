import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { unauthorized } from '../lib/http-error.js';

export interface AuthUser {
  id: number;
  phone: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser, secret: string, expiresIn: string): string {
  return jwt.sign({ phone: user.phone }, secret, {
    subject: String(user.id),
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function requireAuth(secret: string): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw unauthorized('Missing bearer token');

    try {
      const payload = jwt.verify(token, secret) as jwt.JwtPayload;
      req.user = { id: Number(payload.sub), phone: String(payload.phone) };
    } catch {
      throw unauthorized('Invalid or expired token');
    }
    next();
  };
}

/** Use inside handlers mounted behind requireAuth. */
export function currentUser(req: Express.Request): AuthUser {
  if (!req.user) throw unauthorized();
  return req.user;
}
