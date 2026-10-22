import { CURRENCY } from './config';

const currencyFormatter = new Intl.NumberFormat(CURRENCY.locale, {
  style: 'currency',
  currency: CURRENCY.code,
  maximumFractionDigits: 2,
});

export const formatCurrency = (amount: number) => currencyFormatter.format(amount);

/** Formats a Date as 'YYYY-MM-DD' in the device's local timezone. */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export type DurationUnit = 'days' | 'weeks' | 'months';

/** The date `amount` days/weeks/months from `from`, as 'YYYY-MM-DD'. */
export function addDuration(amount: number, unit: DurationUnit, from = new Date()): string {
  const date = new Date(from);
  if (unit === 'months') date.setMonth(date.getMonth() + amount);
  else date.setDate(date.getDate() + amount * (unit === 'weeks' ? 7 : 1));
  return toIsoDate(date);
}

export const addDays = (days: number, from = new Date()) => addDuration(days, 'days', from);

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(iso: string): string {
  const date = iso.length > 10 ? new Date(iso) : parseIsoDate(iso);
  return date.toLocaleDateString(CURRENCY.locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Whole days from today until `iso` (negative when it is in the past). */
export function daysUntil(iso: string, from = new Date()): number {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((parseIsoDate(iso).getTime() - today.getTime()) / 86_400_000);
}

export const pluralize = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
