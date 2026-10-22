import { useState } from 'react';
import { View } from 'react-native';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TextField } from '@/components/ui/text-field';
import { addDuration, type DurationUnit, formatDate } from '@/lib/format';

type Preset = '1w' | '2w' | '1m' | '3m' | 'custom';

const PRESETS: { value: Preset; label: string; amount?: number; unit?: DurationUnit }[] = [
  { value: '1w', label: '1 week', amount: 1, unit: 'weeks' },
  { value: '2w', label: '2 weeks', amount: 2, unit: 'weeks' },
  { value: '1m', label: '1 month', amount: 1, unit: 'months' },
  { value: '3m', label: '3 months', amount: 3, unit: 'months' },
  { value: 'custom', label: 'Custom' },
];

const UNITS: { value: DurationUnit; label: string }[] = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
];

export function DueDateField({ value, onChange, error }: { value: string; onChange(value: string): void; error?: string }) {
  // Remember which shortcut produced the current value so it shows as selected.
  const [preset, setPreset] = useState<Preset | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customUnit, setCustomUnit] = useState<DurationUnit>('days');
  const isComplete = /^\d{4}-\d{2}-\d{2}$/.test(value);

  function applyCustom(amount: string, unit: DurationUnit) {
    setCustomAmount(amount);
    setCustomUnit(unit);
    const n = Number(amount);
    if (amount && n > 0) onChange(addDuration(n, unit));
  }

  function selectPreset(next: Preset) {
    setPreset(next);
    const choice = PRESETS.find((p) => p.value === next);
    if (choice?.amount && choice.unit) onChange(addDuration(choice.amount, choice.unit));
    else if (next === 'custom') applyCustom(customAmount, customUnit);
  }

  return (
    <View className="gap-2">
      <TextField
        label="Due date"
        value={value}
        onChangeText={(text) => {
          setPreset(null);
          onChange(text);
        }}
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        error={error}
        hint={isComplete && !error ? formatDate(value) : 'Or pick a duration below'}
      />
      <SegmentedControl options={PRESETS} value={preset} onChange={selectPreset} />

      {preset === 'custom' ? (
        <View className="gap-2 rounded-xl border border-slate-200 bg-white p-3">
          <TextField
            label={`Due in how many ${customUnit}?`}
            value={customAmount}
            onChangeText={(text) => applyCustom(text.replace(/\D/g, '').slice(0, 3), customUnit)}
            placeholder="e.g. 45"
            keyboardType="number-pad"
            maxLength={3}
            autoFocus
          />
          <SegmentedControl options={UNITS} value={customUnit} onChange={(unit) => applyCustom(customAmount, unit)} />
        </View>
      ) : null}
    </View>
  );
}
