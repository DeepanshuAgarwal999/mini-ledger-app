import { z } from 'zod';
import { badRequest } from './http-error.js';

/** Parse `data` with `schema`, throwing a 400 HttpError with per-field messages on failure. */
export function parse<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      fields[key] ??= issue.message;
    }
    throw badRequest('Validation failed', fields);
  }
  return result.data;
}
