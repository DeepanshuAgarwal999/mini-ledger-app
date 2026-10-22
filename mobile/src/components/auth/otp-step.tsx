import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useRequestOtp, useVerifyOtp } from '@/hooks/use-auth';
import { useForm } from '@/hooks/use-form';
import { errorMessage } from '@/lib/api-client';
import { otpSchema } from '@/lib/validation';

const RESEND_COOLDOWN_SECONDS = 30;
const schema = z.object({ code: otpSchema });

function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);
  return { remaining, restart: () => setRemaining(seconds) };
}

export function OtpStep({ phone, onChangePhone }: { phone: string; onChangePhone(): void }) {
  const { values, errors, setField, validate } = useForm({ code: '' });
  const verifyOtp = useVerifyOtp();
  const resendOtp = useRequestOtp();
  const countdown = useCountdown(RESEND_COOLDOWN_SECONDS);

  function submit() {
    if (!validate(schema)) return;
    verifyOtp.mutate({ phone, code: values.code });
  }

  return (
    <View className="gap-4">
      <Text className="text-base text-slate-600">
        Enter the 6-digit code sent to <Text className="font-semibold text-slate-900">{phone}</Text>.
      </Text>
      <View className="rounded-xl bg-amber-50 p-3">
        <Text className="text-sm text-amber-800">
          Demo mode: no SMS is sent. The code is printed in the backend server log.
        </Text>
      </View>

      <TextField
        label="Verification code"
        value={values.code}
        onChangeText={(text) => {
          const digits = text.replace(/\D/g, '');
          verifyOtp.reset();
          setField('code', digits);
          if (digits.length === 6 && !verifyOtp.isPending) verifyOtp.mutate({ phone, code: digits });
        }}
        placeholder="••••••"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        autoFocus
        error={errors.code ?? (verifyOtp.error ? errorMessage(verifyOtp.error) : undefined)}
      />
      <Button title="Verify & continue" size="lg" loading={verifyOtp.isPending} onPress={submit} />

      <View className="flex-row items-center justify-between">
        <Button title="Change number" variant="ghost" size="sm" onPress={onChangePhone} />
        <Button
          title={countdown.remaining > 0 ? `Resend in ${countdown.remaining}s` : 'Resend code'}
          variant="ghost"
          size="sm"
          disabled={countdown.remaining > 0}
          loading={resendOtp.isPending}
          onPress={() => resendOtp.mutate(phone, { onSuccess: countdown.restart })}
        />
      </View>
      {resendOtp.isSuccess && countdown.remaining > 0 ? (
        <Text className="text-center text-sm text-emerald-700">A new code has been sent.</Text>
      ) : null}
    </View>
  );
}
