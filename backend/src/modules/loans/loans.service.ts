import type { Db } from '../../db/index.js';
import type { Clock } from '../../lib/clock.js';
import { conflict, notFound } from '../../lib/http-error.js';
import { fromCents, toCents } from '../../lib/money.js';
import type { CreateLoanInput, LoanStatusFilter } from './loans.schema.js';

interface LoanRow {
  id: number;
  friend_name: string;
  amount_cents: number | string;
  due_date: string | Date;
  note: string | null;
  receipt_path: string | null;
  repaid_at: Date | null;
  created_at: Date;
}

export type LoanStatus = 'pending' | 'overdue' | 'repaid';

export interface Loan {
  id: number;
  friendName: string;
  amount: number;
  dueDate: string;
  note: string | null;
  status: LoanStatus;
  receiptUrl: string | null;
  repaidAt: string | null;
  createdAt: string;
}

export interface LoanSummary {
  totalLent: number;
  totalRepaid: number;
  outstanding: number;
  overdueAmount: number;
  counts: { total: number; pending: number; overdue: number; repaid: number };
}

const LOAN_COLUMNS = 'id, friend_name, amount_cents, due_date, note, receipt_path, repaid_at, created_at';

// pg returns DATE as a string (see db/index.ts); pg-mem returns a UTC Date.
const toDateString = (value: string | Date) =>
  typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);

function statusOf(row: LoanRow, today: string): LoanStatus {
  if (row.repaid_at) return 'repaid';
  return toDateString(row.due_date) < today ? 'overdue' : 'pending';
}

function toLoan(row: LoanRow, today: string): Loan {
  return {
    id: row.id,
    friendName: row.friend_name,
    amount: fromCents(row.amount_cents),
    dueDate: toDateString(row.due_date),
    note: row.note,
    status: statusOf(row, today),
    receiptUrl: row.receipt_path ? `/api/loans/${row.id}/receipt` : null,
    repaidAt: row.repaid_at ? new Date(row.repaid_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

const STATUS_CONDITIONS: Record<LoanStatusFilter, string> = {
  all: 'TRUE',
  pending: 'repaid_at IS NULL AND due_date >= $2::date',
  overdue: 'repaid_at IS NULL AND due_date < $2::date',
  repaid: 'repaid_at IS NOT NULL',
};

export function createLoanService({ db, clock }: { db: Db; clock: Clock }) {
  async function list(userId: number, status: LoanStatusFilter): Promise<Loan[]> {
    const today = clock.today();
    const usesToday = status === 'pending' || status === 'overdue';
    const { rows } = await db.query<LoanRow>(
      `SELECT ${LOAN_COLUMNS} FROM loans
       WHERE user_id = $1 AND ${STATUS_CONDITIONS[status]}
       ORDER BY CASE WHEN repaid_at IS NULL THEN 0 ELSE 1 END, due_date ASC, id DESC`,
      usesToday ? [userId, today] : [userId],
    );
    return rows.map((row) => toLoan(row, today));
  }

  async function create(userId: number, input: CreateLoanInput, receiptPath: string | null): Promise<Loan> {
    const { rows } = await db.query<LoanRow>(
      `INSERT INTO loans (user_id, friend_name, amount_cents, due_date, note, receipt_path)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${LOAN_COLUMNS}`,
      [userId, input.friendName, toCents(input.amount), input.dueDate, input.note, receiptPath],
    );
    return toLoan(rows[0], clock.today());
  }

  async function findRow(userId: number, loanId: number): Promise<LoanRow> {
    const { rows } = await db.query<LoanRow>(
      `SELECT ${LOAN_COLUMNS} FROM loans WHERE id = $1 AND user_id = $2`,
      [loanId, userId],
    );
    if (!rows[0]) throw notFound('Loan not found');
    return rows[0];
  }

  async function markRepaid(userId: number, loanId: number): Promise<Loan> {
    const { rows } = await db.query<LoanRow>(
      `UPDATE loans SET repaid_at = $3
       WHERE id = $1 AND user_id = $2 AND repaid_at IS NULL
       RETURNING ${LOAN_COLUMNS}`,
      [loanId, userId, clock.now()],
    );
    if (!rows[0]) {
      await findRow(userId, loanId); // throws 404 when the loan does not exist
      throw conflict('Loan is already marked as repaid');
    }
    return toLoan(rows[0], clock.today());
  }

  /** Returns the receipt file name (if any) so the caller can clean it up. */
  async function remove(userId: number, loanId: number): Promise<string | null> {
    const { rows } = await db.query<Pick<LoanRow, 'receipt_path'>>(
      'DELETE FROM loans WHERE id = $1 AND user_id = $2 RETURNING receipt_path',
      [loanId, userId],
    );
    if (!rows[0]) throw notFound('Loan not found');
    return rows[0].receipt_path;
  }

  async function receiptPath(userId: number, loanId: number): Promise<string> {
    const row = await findRow(userId, loanId);
    if (!row.receipt_path) throw notFound('This loan has no receipt');
    return row.receipt_path;
  }

  async function summary(userId: number): Promise<LoanSummary> {
    const { rows } = await db.query(
      `SELECT
         COUNT(*) AS total_count,
         COALESCE(SUM(amount_cents), 0) AS lent,
         COALESCE(SUM(CASE WHEN repaid_at IS NOT NULL THEN amount_cents ELSE 0 END), 0) AS repaid,
         COALESCE(SUM(CASE WHEN repaid_at IS NULL AND due_date < $2::date THEN amount_cents ELSE 0 END), 0) AS overdue,
         COALESCE(SUM(CASE WHEN repaid_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS repaid_count,
         COALESCE(SUM(CASE WHEN repaid_at IS NULL AND due_date < $2::date THEN 1 ELSE 0 END), 0) AS overdue_count
       FROM loans WHERE user_id = $1`,
      [userId, clock.today()],
    );
    const r = rows[0];
    const total = Number(r.total_count);
    const repaidCount = Number(r.repaid_count);
    const overdueCount = Number(r.overdue_count);

    return {
      totalLent: fromCents(r.lent),
      totalRepaid: fromCents(r.repaid),
      outstanding: fromCents(Number(r.lent) - Number(r.repaid)),
      overdueAmount: fromCents(r.overdue),
      counts: {
        total,
        repaid: repaidCount,
        overdue: overdueCount,
        pending: total - repaidCount - overdueCount,
      },
    };
  }

  return { list, create, markRepaid, remove, receiptPath, summary };
}

export type LoanService = ReturnType<typeof createLoanService>;
