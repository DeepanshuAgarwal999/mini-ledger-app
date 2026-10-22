import { apiRequest } from '@/lib/api-client';

export interface User {
  id: number;
  phone: string;
}

export const authApi = {
  requestOtp: (phone: string) =>
    apiRequest<{ message: string; phone: string; expiresInSeconds: number }>('/api/auth/otp/request', {
      method: 'POST',
      body: { phone },
    }),

  verifyOtp: (input: { phone: string; code: string }) =>
    apiRequest<{ token: string; user: User }>('/api/auth/otp/verify', { method: 'POST', body: input }),
};
