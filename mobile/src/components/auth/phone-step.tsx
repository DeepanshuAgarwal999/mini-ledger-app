import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useRequestOtp } from '@/hooks/use-auth';
import { useForm } from '@/hooks/use-form';
import { errorMessage } from '@/lib/api-client';
import { phoneSchema } from '@/lib/validation';
import { z } from 'zod';

const schema = z.object({ phone: phoneSchema });

export function PhoneStep({ initialPhone, onSent }: { initialPhone: string; onSent(phone: string): void }) {
  const { values, errors, setField, validate } = useForm({ phone: initialPhone });
  const requestOtp = useRequestOtp();

  function handleSubmit() {
    const parsed = validate(schema);
    if (!parsed) return;
    requestOtp.mutate(parsed.phone, { onSuccess: (res) => onSent(res.phone) });
  }

  return (
    <View className="gap-4">
      <TextField
        label="Phone number"
        value={values.phone}
        onChangeText={(text) => {
          requestOtp.reset();
          setField('phone', text.replace(/\D/g, ''));
        }}
        placeholder="9876543210"
        keyboardType="number-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        maxLength={10}
        returnKeyType="send"
        onSubmitEditing={handleSubmit}
        error={errors.phone ?? (requestOtp.error ? errorMessage(requestOtp.error) : undefined)}
        hint="Enter your 10-digit mobile number. We'll send you a 6-digit code."
      />
      <Button title="Send code" size="lg" loading={requestOtp.isPending} onPress={handleSubmit} />
    </View>
  );
}
