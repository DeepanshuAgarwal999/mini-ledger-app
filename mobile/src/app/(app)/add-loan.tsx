import { router } from 'expo-router';
import { LoanForm } from '@/components/loans/loan-form';
import { FormScreen } from '@/components/ui/form-screen';
import { useCreateLoan } from '@/hooks/use-loans';

export default function AddLoanScreen() {
  const createLoan = useCreateLoan();

  return (
    <FormScreen>
      <LoanForm
        submitting={createLoan.isPending}
        onSubmit={async (loan) => {
          await createLoan.mutateAsync(loan);
          router.back();
        }}
      />
    </FormScreen>
  );
}
