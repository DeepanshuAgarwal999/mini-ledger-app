import { Text, View } from 'react-native';
import type { NewLoan, ReceiptAsset } from '@/api/loans';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useForm } from '@/hooks/use-form';
import { errorMessage } from '@/lib/api-client';
import { CURRENCY } from '@/lib/config';
import { showError } from '@/lib/dialogs';
import { addDays } from '@/lib/format';
import { loanFormSchema } from '@/lib/validation';
import { DueDateField } from './due-date-field';
import { ReceiptPicker } from './receipt-picker';

const currencySymbol =
  new Intl.NumberFormat(CURRENCY.locale, { style: 'currency', currency: CURRENCY.code })
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value ?? CURRENCY.code;

interface LoanFormProps {
  onSubmit(loan: NewLoan): Promise<unknown>;
  submitting: boolean;
}

export function LoanForm({ onSubmit, submitting }: LoanFormProps) {
  const { values, errors, setField, validate, applyServerErrors } = useForm({
    friendName: '',
    amount: '',
    dueDate: addDays(14),
    note: '',
    receipt: null as ReceiptAsset | null,
  });

  async function handleSubmit() {
    const parsed = validate(loanFormSchema);
    if (!parsed) return;
    try {
      await onSubmit({ ...parsed, receipt: values.receipt });
    } catch (error) {
      // Field errors are shown inline; anything else (network, server) gets a dialog.
      if (!applyServerErrors(error)) showError(errorMessage(error), "Couldn't save the loan");
    }
  }

  return (
    <View className="gap-5">
      <TextField
        label="Friend's name"
        value={values.friendName}
        onChangeText={(text) => setField('friendName', text)}
        placeholder="e.g. Ravi Kumar"
        autoCapitalize="words"
        autoFocus
        maxLength={100}
        error={errors.friendName}
      />
      <TextField
        label="Amount"
        value={values.amount}
        onChangeText={(text) => setField('amount', text.replace(',', '.'))}
        placeholder="0.00"
        keyboardType="decimal-pad"
        prefix={<Text className="mr-1 text-base text-slate-500">{currencySymbol}</Text>}
        error={errors.amount}
      />
      <DueDateField value={values.dueDate} onChange={(date) => setField('dueDate', date)} error={errors.dueDate} />
      <TextField
        label="Note (optional)"
        value={values.note}
        onChangeText={(text) => setField('note', text)}
        placeholder="What was it for?"
        multiline
        maxLength={500}
        error={errors.note}
      />
      <ReceiptPicker value={values.receipt} onChange={(asset) => setField('receipt', asset)} />
      {errors.receipt ? <Text className="text-sm text-rose-600">{errors.receipt}</Text> : null}

      <Button title="Save loan" size="lg" loading={submitting} onPress={handleSubmit} />
    </View>
  );
}
