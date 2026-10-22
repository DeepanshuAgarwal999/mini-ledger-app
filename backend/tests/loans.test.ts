import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers.js';

// 1x1 transparent PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

describe('loans', () => {
  let ctx: Awaited<ReturnType<typeof createTestApp>>;
  let auth: { Authorization: string };

  beforeEach(async () => {
    ctx = await createTestApp();
    auth = { Authorization: `Bearer ${await ctx.login()}` };
  });

  const createLoan = (body: Record<string, unknown>) =>
    request(ctx.app).post('/api/loans').set(auth).send(body);

  it('requires authentication', async () => {
    await request(ctx.app).get('/api/loans').expect(401);
    await request(ctx.app).get('/api/loans/summary').expect(401);
  });

  it('validates the loan input', async () => {
    const res = await createLoan({ friendName: '  ', amount: -5, dueDate: '2026-02-30' }).expect(400);
    expect(Object.keys(res.body.details).sort()).toEqual(['amount', 'dueDate', 'friendName']);

    const decimals = await createLoan({ friendName: 'Ravi', amount: 10.555, dueDate: '2026-11-01' }).expect(400);
    expect(decimals.body.details.amount).toMatch(/2 decimal/);
  });

  it('creates a loan and lists it', async () => {
    const res = await createLoan({ friendName: ' Ravi ', amount: 1500.5, dueDate: '2026-11-01', note: 'Dinner' }).expect(201);
    expect(res.body.loan).toMatchObject({
      friendName: 'Ravi',
      amount: 1500.5,
      dueDate: '2026-11-01',
      note: 'Dinner',
      status: 'pending',
      receiptUrl: null,
      repaidAt: null,
    });

    const list = await request(ctx.app).get('/api/loans').set(auth).expect(200);
    expect(list.body.loans).toHaveLength(1);
  });

  it('marks past-due unpaid loans as overdue and filters by status', async () => {
    await createLoan({ friendName: 'Late', amount: 100, dueDate: '2026-10-01' }).expect(201);
    await createLoan({ friendName: 'Today', amount: 200, dueDate: '2026-10-22' }).expect(201);

    const all = await request(ctx.app).get('/api/loans').set(auth).expect(200);
    const byName = Object.fromEntries(all.body.loans.map((l: any) => [l.friendName, l.status]));
    expect(byName).toEqual({ Late: 'overdue', Today: 'pending' });

    const overdue = await request(ctx.app).get('/api/loans?status=overdue').set(auth).expect(200);
    expect(overdue.body.loans.map((l: any) => l.friendName)).toEqual(['Late']);

    await request(ctx.app).get('/api/loans?status=bogus').set(auth).expect(400);
  });

  it('marks a loan as repaid exactly once', async () => {
    const { body } = await createLoan({ friendName: 'Ravi', amount: 100, dueDate: '2026-10-01' }).expect(201);
    const repaid = await request(ctx.app).patch(`/api/loans/${body.loan.id}/repay`).set(auth).expect(200);
    expect(repaid.body.loan.status).toBe('repaid');
    expect(repaid.body.loan.repaidAt).toBeTruthy();

    await request(ctx.app).patch(`/api/loans/${body.loan.id}/repay`).set(auth).expect(409);
    await request(ctx.app).patch('/api/loans/9999/repay').set(auth).expect(404);
  });

  it("does not expose another user's loans", async () => {
    const { body } = await createLoan({ friendName: 'Ravi', amount: 100, dueDate: '2026-11-01' }).expect(201);
    const other = { Authorization: `Bearer ${await ctx.login('9123456780')}` };

    const list = await request(ctx.app).get('/api/loans').set(other).expect(200);
    expect(list.body.loans).toEqual([]);
    await request(ctx.app).patch(`/api/loans/${body.loan.id}/repay`).set(other).expect(404);
    await request(ctx.app).delete(`/api/loans/${body.loan.id}`).set(other).expect(404);
  });

  it('summarises lent, repaid and overdue amounts', async () => {
    await createLoan({ friendName: 'A', amount: 1000, dueDate: '2026-10-01' }).expect(201); // overdue
    await createLoan({ friendName: 'B', amount: 250.25, dueDate: '2026-12-01' }).expect(201); // pending
    const { body } = await createLoan({ friendName: 'C', amount: 500, dueDate: '2026-09-01' }).expect(201);
    await request(ctx.app).patch(`/api/loans/${body.loan.id}/repay`).set(auth).expect(200); // repaid

    const summary = await request(ctx.app).get('/api/loans/summary').set(auth).expect(200);
    expect(summary.body).toEqual({
      totalLent: 1750.25,
      totalRepaid: 500,
      outstanding: 1250.25,
      overdueAmount: 1000,
      counts: { total: 3, pending: 1, overdue: 1, repaid: 1 },
    });
  });

  it('returns a zero summary for a new user', async () => {
    const summary = await request(ctx.app).get('/api/loans/summary').set(auth).expect(200);
    expect(summary.body.totalLent).toBe(0);
    expect(summary.body.counts.total).toBe(0);
  });

  it('accepts a receipt image upload and serves it back', async () => {
    const res = await request(ctx.app)
      .post('/api/loans')
      .set(auth)
      .field('friendName', 'Ravi')
      .field('amount', '42')
      .field('dueDate', '2026-11-01')
      .attach('receipt', PNG, { filename: 'receipt.png', contentType: 'image/png' })
      .expect(201);
    expect(res.body.loan.receiptUrl).toBe(`/api/loans/${res.body.loan.id}/receipt`);

    const file = await request(ctx.app).get(res.body.loan.receiptUrl).set(auth).expect(200);
    expect(file.headers['content-type']).toBe('image/png');

    await request(ctx.app).delete(`/api/loans/${res.body.loan.id}`).set(auth).expect(204);
    expect(fs.readdirSync(ctx.uploadDir)).toEqual([]);
  });

  it('rejects non-image receipts and does not keep files from invalid requests', async () => {
    await request(ctx.app)
      .post('/api/loans')
      .set(auth)
      .field('friendName', 'Ravi')
      .field('amount', '42')
      .field('dueDate', '2026-11-01')
      .attach('receipt', Buffer.from('hello'), { filename: 'x.txt', contentType: 'text/plain' })
      .expect(400);

    await request(ctx.app)
      .post('/api/loans')
      .set(auth)
      .field('friendName', 'Ravi')
      .field('amount', 'abc')
      .field('dueDate', '2026-11-01')
      .attach('receipt', PNG, { filename: 'receipt.png', contentType: 'image/png' })
      .expect(400);

    expect(fs.readdirSync(path.resolve(ctx.uploadDir))).toEqual([]);
  });
});
