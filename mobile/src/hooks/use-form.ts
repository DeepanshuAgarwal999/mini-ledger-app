import { useState } from 'react';
import type { z } from 'zod';
import { ApiError } from '@/lib/api-client';
import { type FieldErrors, issuesToFieldErrors } from '@/lib/validation';

/** Small form-state helper: values, per-field errors, zod validation and server error mapping. */
export function useForm<T extends Record<string, unknown>>(initialValues: T) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});

  function setField<K extends keyof T>(key: K, value: T[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  /** Returns the parsed values, or null after recording field errors. */
  function validate<S extends z.ZodType>(schema: S): z.output<S> | null {
    const result = schema.safeParse(values);
    if (!result.success) {
      setErrors(issuesToFieldErrors(result.error.issues));
      return null;
    }
    setErrors({});
    return result.data;
  }

  /** Shows field-level errors returned by the API; returns false if there were none to show. */
  function applyServerErrors(error: unknown): boolean {
    if (error instanceof ApiError && error.fieldErrors) {
      setErrors(error.fieldErrors);
      return true;
    }
    return false;
  }

  return { values, errors, setField, validate, applyServerErrors };
}
