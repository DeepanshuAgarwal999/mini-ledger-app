import { z } from 'zod';

const isoDate = z
  .string({ error: 'Due date is required' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'Due date is not a real calendar date');

// Multipart bodies arrive as strings, so amount is coerced.
export const createLoanSchema = z.object({
  friendName: z
    .string({ error: 'Friend name is required' })
    .trim()
    .min(1, 'Friend name is required')
    .max(100, 'Friend name must be at most 100 characters'),
  amount: z.coerce
    .number({ error: 'Amount must be a number' })
    .positive('Amount must be greater than 0')
    .max(10_000_000, 'Amount is too large')
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, 'Amount can have at most 2 decimal places'),
  dueDate: isoDate,
  note: z
    .string()
    .trim()
    .max(500, 'Note must be at most 500 characters')
    .optional()
    .transform((value) => value || null),
});

export const loanStatusFilter = z.enum(['all', 'pending', 'overdue', 'repaid']);

export const listLoansQuery = z.object({
  status: loanStatusFilter.default('all'),
});

export const loanIdParams = z.object({
  id: z.coerce.number().int().positive('Invalid loan id'),
});

export type CreateLoanInput = z.output<typeof createLoanSchema>;
export type LoanStatusFilter = z.output<typeof loanStatusFilter>;
