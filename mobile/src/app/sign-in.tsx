import { useState } from 'react';
import { Text, View } from 'react-native';
import { OtpStep } from '@/components/auth/otp-step';
import { PhoneStep } from '@/components/auth/phone-step';
import { Card } from '@/components/ui/card';
import { FormScreen } from '@/components/ui/form-screen';

export default function SignInScreen() {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  return (
    <FormScreen padTop>
      <View className="flex-1 justify-center gap-8">
        <View className="items-center gap-3">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600">
            <Text className="text-3xl font-bold text-white">₹</Text>
          </View>
          <Text className="text-3xl font-bold text-slate-900">MiniLedger</Text>
          <Text className="text-center text-base text-slate-500">Keep track of money you&apos;ve lent to friends.</Text>
        </View>

        <Card className="gap-4 p-5">
          <Text className="text-xl font-semibold text-slate-900">
            {step === 'phone' ? 'Sign in with your phone' : 'Verify your number'}
          </Text>
          {step === 'phone' ? (
            <PhoneStep
              initialPhone={phone}
              onSent={(normalized) => {
                setPhone(normalized);
                setStep('otp');
              }}
            />
          ) : (
            <OtpStep phone={phone} onChangePhone={() => setStep('phone')} />
          )}
        </Card>
      </View>
    </FormScreen>
  );
}
