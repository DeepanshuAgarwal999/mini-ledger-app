import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LoanFilter } from '@/api/loans';
import { LoanCard } from '@/components/loans/loan-card';
import { LoanFilterTabs } from '@/components/loans/loan-filter-tabs';
import { SummaryCard } from '@/components/loans/summary-card';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { loanKeys, useLoans } from '@/hooks/use-loans';
import { errorMessage } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';

const EMPTY_MESSAGES: Record<LoanFilter, { title: string; message: string }> = {
  all: { title: 'No loans yet', message: 'Add the first amount you lent to a friend to start tracking it.' },
  overdue: { title: 'Nothing overdue', message: 'Everyone is on time. Nice!' },
  pending: { title: 'No pending loans', message: 'Loans that are not yet due will show up here.' },
  repaid: { title: 'No repaid loans', message: 'Loans you mark as repaid will show up here.' },
};

const openAddLoan = () => router.push('/add-loan');

export default function DashboardScreen() {
  const [filter, setFilter] = useState<LoanFilter>('all');
  const loans = useLoans(filter);
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: loanKeys.all });
    setRefreshing(false);
  }

  return (
    <View className="flex-1 bg-slate-50">
      <FlatList
        data={loans.data ?? []}
        keyExtractor={(loan) => String(loan.id)}
        renderItem={({ item }) => <LoanCard loan={item} />}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 96 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#059669" />}
        ListHeaderComponent={
          <View className="gap-4 pb-1">
            <SummaryCard />
            <Text className="mt-2 text-lg font-semibold text-slate-900">Your loans</Text>
            <LoanFilterTabs value={filter} onChange={setFilter} />
          </View>
        }
        ListEmptyComponent={
          loans.isPending ? (
            <LoadingState label="Loading loans…" />
          ) : loans.error ? (
            <ErrorState message={errorMessage(loans.error)} onRetry={() => loans.refetch()} />
          ) : (
            <EmptyState
              {...EMPTY_MESSAGES[filter]}
              action={filter === 'all' ? <Button title="Add a loan" onPress={openAddLoan} /> : undefined}
            />
          )
        }
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add a loan"
        onPress={openAddLoan}
        className="absolute right-5 h-14 flex-row items-center gap-2 rounded-full bg-emerald-600 px-5 shadow-lg active:bg-emerald-700"
        style={{ bottom: insets.bottom + 20, elevation: 6 }}
      >
        <Text className="text-2xl font-light text-white">+</Text>
        <Text className="text-base font-semibold text-white">Add loan</Text>
      </Pressable>
    </View>
  );
}
