import { z } from 'zod';

export type FieldErrors = Record<string, string | undefined>;

export function issuesToFieldErrors(issues: z.core.$ZodIssue[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.join('.') || '_';
    errors[key] ??= issue.message;
  }
  return errors;
}

// These mirror the backend's rules so users get instant feedback; the server re-validates.

export const phoneSchema = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit phone number'));

export const otpSchema = z.string().regex(/^\d{6}$/, 'Enter the 6-digit code');

const isRealDate = (value: string) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

export const loanFormSchema = z.object({
  friendName: z.string().trim().min(1, 'Friend name is required').max(100, 'Keep it under 100 characters'),
  amount: z
    .string()
    .trim()
    .min(1, 'Amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (up to 2 decimals)')
    .transform(Number)
    .refine((value) => value > 0, 'Amount must be greater than 0')
    .refine((value) => value <= 10_000_000, 'Amount is too large'),
  dueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
    .refine(isRealDate, 'That date does not exist'),
  note: z.string().trim().max(500, 'Keep the note under 500 characters'),
});
