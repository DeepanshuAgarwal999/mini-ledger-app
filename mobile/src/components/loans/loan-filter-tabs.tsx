import type { LoanFilter } from '@/api/loans';
import { type SegmentOption, SegmentedControl } from '@/components/ui/segmented-control';
import { useLoanSummary } from '@/hooks/use-loans';

const LABELS: Record<LoanFilter, string> = {
  all: 'All',
  overdue: 'Overdue',
  pending: 'Pending',
  repaid: 'Repaid',
};

export function LoanFilterTabs({ value, onChange }: { value: LoanFilter; onChange(value: LoanFilter): void }) {
  const { data } = useLoanSummary();
  const counts: Record<LoanFilter, number> | undefined = data && { ...data.counts, all: data.counts.total };

  const options: SegmentOption<LoanFilter>[] = (Object.keys(LABELS) as LoanFilter[]).map((filter) => ({
    value: filter,
    label: counts ? `${LABELS[filter]} · ${counts[filter]}` : LABELS[filter],
  }));

  return <SegmentedControl options={options} value={value} onChange={onChange} />;
}
