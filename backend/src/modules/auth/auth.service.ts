import { randomInt } from 'node:crypto';
import type { Db } from '../../db/index.js';
import type { Clock } from '../../lib/clock.js';
import { tooManyRequests, unauthorized } from '../../lib/http-error.js';
import { type AuthUser, signToken } from '../../middleware/auth.js';

export type OtpSender = (phone: string, code: string) => void;

/** Mock delivery: the OTP is only printed to the server log. */
export const logOtpSender: OtpSender = (phone, code) => {
  console.log(`[OTP] Login code for ${phone}: ${code}`);
};

interface AuthServiceDeps {
  db: Db;
  clock: Clock;
  sendOtp: OtpSender;
  jwtSecret: string;
  jwtExpiresIn: string;
  otpTtlSeconds: number;
  otpMaxAttempts: number;
}

export function createAuthService(deps: AuthServiceDeps) {
  const { db, clock } = deps;

  async function requestOtp(phone: string) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const expiresAt = new Date(clock.now().getTime() + deps.otpTtlSeconds * 1000);

    await db.query(
      `INSERT INTO otp_codes (phone, code, expires_at, attempts)
       VALUES ($1, $2, $3, 0)
       ON CONFLICT (phone) DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, attempts = 0`,
      [phone, code, expiresAt],
    );
    deps.sendOtp(phone, code);

    return { expiresInSeconds: deps.otpTtlSeconds };
  }

  async function verifyOtp(phone: string, code: string) {
    const { rows } = await db.query<{ code: string; expires_at: Date; attempts: number }>(
      'SELECT code, expires_at, attempts FROM otp_codes WHERE phone = $1',
      [phone],
    );
    const otp = rows[0];
    if (!otp || new Date(otp.expires_at) <= clock.now()) {
      throw unauthorized('OTP expired or not requested. Please request a new one.');
    }
    if (otp.attempts >= deps.otpMaxAttempts) {
      throw tooManyRequests('Too many incorrect attempts. Please request a new OTP.');
    }
    if (otp.code !== code) {
      await db.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE phone = $1', [phone]);
      throw unauthorized('Incorrect OTP');
    }

    await db.query('DELETE FROM otp_codes WHERE phone = $1', [phone]);
    const user = await findOrCreateUser(phone);
    return { token: signToken(user, deps.jwtSecret, deps.jwtExpiresIn), user };
  }

  async function findOrCreateUser(phone: string): Promise<AuthUser> {
    const { rows } = await db.query<AuthUser>(
      `INSERT INTO users (phone) VALUES ($1)
       ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
       RETURNING id, phone`,
      [phone],
    );
    return rows[0];
  }

  return { requestOtp, verifyOtp };
}

export type AuthService = ReturnType<typeof createAuthService>;
