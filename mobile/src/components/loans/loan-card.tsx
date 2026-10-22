import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import type { Loan, LoanStatus } from '@/api/loans';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDeleteLoan, useMarkRepaid } from '@/hooks/use-loans';
import { errorMessage } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { confirm, showError } from '@/lib/dialogs';
import { daysUntil, formatCurrency, formatDate, pluralize } from '@/lib/format';
import { ReceiptImage } from './receipt-image';

const STATUS_BADGE: Record<LoanStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  overdue: { label: 'Overdue', tone: 'danger' },
  repaid: { label: 'Repaid', tone: 'success' },
};

function dueLabel(loan: Loan): string {
  if (loan.repaidAt) return `Repaid on ${formatDate(loan.repaidAt)}`;
  const days = daysUntil(loan.dueDate);
  if (days < 0) return `${pluralize(-days, 'day')} overdue · was due ${formatDate(loan.dueDate)}`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days · ${formatDate(loan.dueDate)}`;
}

export function LoanCard({ loan }: { loan: Loan }) {
  const markRepaid = useMarkRepaid();
  const deleteLoan = useDeleteLoan();
  const isOverdue = loan.status === 'overdue';
  const isRepaid = loan.status === 'repaid';
  const badge = STATUS_BADGE[loan.status];

  async function handleRepaid() {
    const ok = await confirm({
      title: 'Mark as repaid?',
      message: `${loan.friendName} paid back ${formatCurrency(loan.amount)}.`,
      confirmText: 'Mark repaid',
    });
    if (ok) markRepaid.mutate(loan.id, { onError: (e) => showError(errorMessage(e)) });
  }

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete this loan?',
      message: 'This permanently removes the entry and its receipt.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (ok) deleteLoan.mutate(loan.id, { onError: (e) => showError(errorMessage(e)) });
  }

  return (
    <View
      className={cn(
        'overflow-hidden rounded-2xl border bg-white',
        isOverdue ? 'border-rose-300 bg-rose-50' : 'border-slate-200',
      )}
    >
      {isOverdue ? <View className="absolute bottom-0 left-0 top-0 w-1.5 bg-rose-500" /> : null}

      <View className="flex-row gap-3 p-4 pl-5">
        <View className="flex-1 gap-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text className={cn('flex-1 text-base font-semibold', isRepaid ? 'text-slate-500' : 'text-slate-900')} numberOfLines={1}>
              {loan.friendName}
            </Text>
            <Badge label={badge.label} tone={badge.tone} />
          </View>
          <Text
            className={cn(
              'text-2xl font-bold',
              isOverdue ? 'text-rose-700' : isRepaid ? 'text-slate-400 line-through' : 'text-slate-900',
            )}
          >
            {formatCurrency(loan.amount)}
          </Text>
          <Text className={cn('text-sm', isOverdue ? 'font-medium text-rose-700' : 'text-slate-500')}>{dueLabel(loan)}</Text>
          {loan.note ? (
            <Text className="text-sm text-slate-600" numberOfLines={2}>
              {loan.note}
            </Text>
          ) : null}
        </View>

        {loan.receiptUrl ? (
          <Pressable
            accessibilityRole="imagebutton"
            accessibilityLabel={`View receipt for ${loan.friendName}`}
            onPress={() => router.push({ pathname: '/receipt/[id]', params: { id: String(loan.id) } })}
            className="active:opacity-70"
          >
            <ReceiptImage path={loan.receiptUrl} style={{ width: 56, height: 56, borderRadius: 10 }} />
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row items-center justify-end gap-2 border-t border-slate-100 px-4 py-2">
        <Button title="Delete" variant="ghost" size="sm" loading={deleteLoan.isPending} onPress={handleDelete} />
        {!isRepaid ? (
          <Button
            title="Mark repaid"
            variant={isOverdue ? 'danger' : 'secondary'}
            size="sm"
            loading={markRepaid.isPending}
            onPress={handleRepaid}
          />
        ) : null}
      </View>
    </View>
  );
}
