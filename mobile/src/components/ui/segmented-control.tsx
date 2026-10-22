import { Pressable, ScrollView, Text } from 'react-native';
import { cn } from '@/lib/cn';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  /** null when no option is selected. */
  value: T | null;
  onChange(value: T): void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={cn(
              'h-9 justify-center rounded-full border px-4',
              selected ? 'border-slate-900 bg-slate-900' : 'border-slate-300 bg-white active:bg-slate-100',
            )}
          >
            <Text className={cn('text-sm font-medium', selected ? 'text-white' : 'text-slate-700')}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
