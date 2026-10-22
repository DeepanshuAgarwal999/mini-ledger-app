import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { createApp } from '../src/app.js';
import type { Db } from '../src/db/index.js';
import { migrate } from '../src/db/schema.js';
import type { Clock } from '../src/lib/clock.js';

export const TODAY = '2026-10-22';

/** A controllable clock pinned to TODAY at noon. */
export function fixedClock(): Clock & { advance(ms: number): void } {
  let now = new Date(`${TODAY}T12:00:00`);
  return {
    now: () => new Date(now),
    today: () => TODAY,
    advance: (ms) => {
      now = new Date(now.getTime() + ms);
    },
  };
}

export async function createTestApp() {
  const mem = newDb();
  const { Pool } = mem.adapters.createPg();
  const db: Db = new Pool();
  await migrate(db);

  const clock = fixedClock();
  const sentOtps = new Map<string, string>();
  const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'miniledger-test-'));

  const app = createApp({
    db,
    clock,
    sendOtp: (phone, code) => sentOtps.set(phone, code),
    config: {
      jwtSecret: 'test-secret',
      jwtExpiresIn: '1h',
      otpTtlSeconds: 300,
      otpMaxAttempts: 3,
      uploadDir,
      maxUploadBytes: 1024 * 1024,
    },
  });

  async function login(phone = '9876543210'): Promise<string> {
    await request(app).post('/api/auth/otp/request').send({ phone }).expect(200);
    const res = await request(app)
      .post('/api/auth/otp/verify')
      .send({ phone, code: sentOtps.get(phone) })
      .expect(200);
    return res.body.token;
  }

  return { app, clock, sentOtps, uploadDir, login };
}
