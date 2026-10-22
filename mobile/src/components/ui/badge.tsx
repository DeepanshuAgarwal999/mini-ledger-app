import { Text, View } from 'react-native';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning';

const TONES: Record<BadgeTone, { container: string; text: string }> = {
  neutral: { container: 'bg-slate-100', text: 'text-slate-700' },
  success: { container: 'bg-emerald-100', text: 'text-emerald-800' },
  danger: { container: 'bg-rose-100', text: 'text-rose-700' },
  warning: { container: 'bg-amber-100', text: 'text-amber-800' },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  return (
    <View className={cn('self-start rounded-full px-2.5 py-0.5', TONES[tone].container)}>
      <Text className={cn('text-xs font-semibold', TONES[tone].text)}>{label}</Text>
    </View>
  );
}
