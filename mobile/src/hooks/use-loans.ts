import { type MutationFunction, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type LoanFilter, loansApi } from '@/api/loans';

export const loanKeys = {
  all: ['loans'] as const,
  list: (filter: LoanFilter) => ['loans', 'list', filter] as const,
  summary: () => ['loans', 'summary'] as const,
};

export const useLoans = (filter: LoanFilter) =>
  useQuery({ queryKey: loanKeys.list(filter), queryFn: () => loansApi.list(filter) });

export const useLoanSummary = () => useQuery({ queryKey: loanKeys.summary(), queryFn: loansApi.summary });

/** Any write to loans changes both the lists and the summary, so refresh everything under 'loans'. */
function useLoanMutation<TData, TVariables>(mutationFn: MutationFunction<TData, TVariables>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: loanKeys.all }),
  });
}

export const useCreateLoan = () => useLoanMutation(loansApi.create);
export const useMarkRepaid = () => useLoanMutation(loansApi.markRepaid);
export const useDeleteLoan = () => useLoanMutation(loansApi.remove);
