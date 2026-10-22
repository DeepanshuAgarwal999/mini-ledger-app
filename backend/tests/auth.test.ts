import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers.js';

describe('auth', () => {
  let ctx: Awaited<ReturnType<typeof createTestApp>>;
  beforeEach(async () => {
    ctx = await createTestApp();
  });

  it('rejects an invalid phone number', async () => {
    const res = await request(ctx.app).post('/api/auth/otp/request').send({ phone: '12ab' }).expect(400);
    expect(res.body.details.phone).toMatch(/10-digit/);
  });

  it('ignores spaces and dashes and sends a 6 digit OTP', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/otp/request')
      .send({ phone: '98765-43 210' })
      .expect(200);
    expect(res.body.phone).toBe('9876543210');
    expect(ctx.sentOtps.get('9876543210')).toMatch(/^\d{6}$/);
  });

  it('logs in with the correct OTP and returns a usable token', async () => {
    const token = await ctx.login('9876543210');
    const me = await request(ctx.app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(me.body.user.phone).toBe('9876543210');
  });

  it('returns the same user on a second login', async () => {
    const first = await ctx.login();
    const second = await ctx.login();
    const a = await request(ctx.app).get('/api/auth/me').set('Authorization', `Bearer ${first}`);
    const b = await request(ctx.app).get('/api/auth/me').set('Authorization', `Bearer ${second}`);
    expect(a.body.user.id).toBe(b.body.user.id);
  });

  it('rejects a wrong OTP and locks out after too many attempts', async () => {
    const phone = '9876543210';
    await request(ctx.app).post('/api/auth/otp/request').send({ phone }).expect(200);
    const wrong = ctx.sentOtps.get(phone) === '000000' ? '111111' : '000000';

    for (let i = 0; i < 3; i++) {
      await request(ctx.app).post('/api/auth/otp/verify').send({ phone, code: wrong }).expect(401);
    }
    await request(ctx.app)
      .post('/api/auth/otp/verify')
      .send({ phone, code: ctx.sentOtps.get(phone) })
      .expect(429);
  });

  it('rejects an expired OTP', async () => {
    const phone = '9876543210';
    await request(ctx.app).post('/api/auth/otp/request').send({ phone }).expect(200);
    ctx.clock.advance(301 * 1000);
    await request(ctx.app)
      .post('/api/auth/otp/verify')
      .send({ phone, code: ctx.sentOtps.get(phone) })
      .expect(401);
  });

  it('does not allow an OTP to be reused', async () => {
    const phone = '9876543210';
    await ctx.login(phone);
    await request(ctx.app)
      .post('/api/auth/otp/verify')
      .send({ phone, code: ctx.sentOtps.get(phone) })
      .expect(401);
  });

  it('rejects requests without a valid token', async () => {
    await request(ctx.app).get('/api/auth/me').expect(401);
    await request(ctx.app).get('/api/auth/me').set('Authorization', 'Bearer nope').expect(401);
  });
});
