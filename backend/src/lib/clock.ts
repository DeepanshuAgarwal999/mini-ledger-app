export interface Clock {
  now(): Date;
  /** Today's date in the server's local timezone, as 'YYYY-MM-DD'. */
  today(): string;
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const systemClock: Clock = {
  now: () => new Date(),
  today: () => toIsoDate(new Date()),
};
