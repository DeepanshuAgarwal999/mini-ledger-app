import { type ReactNode, useState } from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';
import { cn } from '@/lib/cn';

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  /** Rendered inside the input box, before the text (e.g. a currency symbol). */
  prefix?: ReactNode;
  className?: string;
}

export function TextField({ label, error, hint, prefix, className, multiline, ...inputProps }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className={cn('gap-1.5', className)}>
      <Text className="text-sm font-medium text-slate-700">{label}</Text>
      <View
        className={cn(
          'flex-row items-center rounded-xl border bg-white px-3',
          multiline ? 'min-h-24 py-2' : 'h-12',
          error ? 'border-rose-500' : focused ? 'border-emerald-500' : 'border-slate-300',
        )}
      >
        {prefix}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor="#94a3b8"
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          className={cn('flex-1 text-base text-slate-900 web:outline-none', multiline && 'self-stretch')}
          {...inputProps}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
        />
      </View>
      {error ? (
        <Text className="text-sm text-rose-600">{error}</Text>
      ) : hint ? (
        <Text className="text-sm text-slate-500">{hint}</Text>
      ) : null}
    </View>
  );
}
