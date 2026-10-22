import { ActivityIndicator, Pressable, type PressableProps, Text } from 'react-native';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, { container: string; text: string; spinner: string }> = {
  primary: { container: 'bg-emerald-600 active:bg-emerald-700', text: 'text-white', spinner: '#ffffff' },
  secondary: { container: 'bg-emerald-50 active:bg-emerald-100', text: 'text-emerald-700', spinner: '#047857' },
  outline: { container: 'border border-slate-300 bg-white active:bg-slate-50', text: 'text-slate-700', spinner: '#334155' },
  ghost: { container: 'active:bg-slate-100', text: 'text-slate-600', spinner: '#475569' },
  danger: { container: 'bg-rose-600 active:bg-rose-700', text: 'text-white', spinner: '#ffffff' },
};

const SIZES: Record<Size, { container: string; text: string }> = {
  sm: { container: 'h-9 px-3 rounded-lg', text: 'text-sm' },
  md: { container: 'h-11 px-4 rounded-xl', text: 'text-base' },
  lg: { container: 'h-14 px-5 rounded-2xl', text: 'text-lg' },
};

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
}

export function Button({ title, variant = 'primary', size = 'md', loading, disabled, className, ...rest }: ButtonProps) {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      className={cn('flex-row items-center justify-center', s.container, v.container, isDisabled && 'opacity-60', className)}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.spinner} />
      ) : (
        <Text className={cn('font-semibold', s.text, v.text)}>{title}</Text>
      )}
    </Pressable>
  );
}
