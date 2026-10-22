import { z } from 'zod';

/** A 10-digit mobile number; spaces and dashes are ignored. */
export const phoneSchema = z
  .string({ error: 'Phone number is required' })
  .transform((value) => value.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit phone number'));

export const requestOtpSchema = z.object({ phone: phoneSchema });

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string({ error: 'OTP is required' }).regex(/^\d{6}$/, 'OTP must be 6 digits'),
});
