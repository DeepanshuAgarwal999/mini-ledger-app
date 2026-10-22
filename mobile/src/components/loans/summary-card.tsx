import { ActivityIndicator, Text, View } from 'react-native';
import { useLoanSummary } from '@/hooks/use-loans';
import { errorMessage } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { formatCurrency, pluralize } from '@/lib/format';

function StatTile({ label, value, caption, tone = 'default' }: {
  label: string;
  value: string;
  caption?: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <View className={cn('flex-1 rounded-xl p-3', tone === 'danger' ? 'bg-rose-500/25' : 'bg-white/10')}>
      <Text className="text-xs font-medium uppercase tracking-wide text-emerald-100">{label}</Text>
      <Text className="mt-1 text-base font-bold text-white" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {caption ? <Text className="text-xs text-emerald-100">{caption}</Text> : null}
    </View>
  );
}

export function SummaryCard() {
  const { data, isPending, error } = useLoanSummary();

  return (
    <View className="rounded-3xl bg-emerald-700 p-5">
      <Text className="text-sm font-medium text-emerald-100">Still to be repaid</Text>
      {isPending ? (
        <ActivityIndicator className="my-6" color="#ffffff" />
      ) : error ? (
        <Text className="my-4 text-emerald-50">{errorMessage(error)}</Text>
      ) : (
        <>
          <Text className="mt-1 text-4xl font-bold text-white">{formatCurrency(data.outstanding)}</Text>
          <Text className="mt-1 text-sm text-emerald-100">
            across {pluralize(data.counts.pending + data.counts.overdue, 'open loan')}
          </Text>
          <View className="mt-5 flex-row gap-2">
            <StatTile label="Lent" value={formatCurrency(data.totalLent)} caption={pluralize(data.counts.total, 'loan')} />
            <StatTile label="Repaid" value={formatCurrency(data.totalRepaid)} caption={`${data.counts.repaid} settled`} />
            <StatTile
              label="Overdue"
              value={formatCurrency(data.overdueAmount)}
              caption={`${data.counts.overdue} late`}
              tone={data.overdueAmount > 0 ? 'danger' : 'default'}
            />
          </View>
        </>
      )}
    </View>
  );
}
