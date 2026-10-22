import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { useSession } from '@/providers/session-provider';

export const useRequestOtp = () => useMutation({ mutationFn: authApi.requestOtp });

export function useVerifyOtp() {
  const { signIn } = useSession();
  return useMutation({
    mutationFn: authApi.verifyOtp,
    onSuccess: ({ token, user }) => signIn({ token, phone: user.phone }),
  });
}
