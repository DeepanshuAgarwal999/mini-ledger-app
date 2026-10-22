import 'dotenv/config';
import path from 'node:path';

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export interface AppConfig {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  otpTtlSeconds: number;
  otpMaxAttempts: number;
  uploadDir: string;
  maxUploadBytes: number;
}

export function loadConfig(): AppConfig {
  return {
    port: Number(env('PORT', '4000')),
    databaseUrl: env('DATABASE_URL'),
    jwtSecret: env('JWT_SECRET'),
    jwtExpiresIn: '7d',
    otpTtlSeconds: 5 * 60,
    otpMaxAttempts: 5,
    uploadDir: path.resolve(env('UPLOAD_DIR', 'uploads')),
    maxUploadBytes: 5 * 1024 * 1024,
  };
}
