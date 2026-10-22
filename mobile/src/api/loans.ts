import { apiRequest } from '@/lib/api-client';
import { toFormFile } from '@/lib/form-file';

export type LoanStatus = 'pending' | 'overdue' | 'repaid';
export type LoanFilter = 'all' | LoanStatus;

export interface Loan {
  id: number;
  friendName: string;
  amount: number;
  dueDate: string;
  note: string | null;
  status: LoanStatus;
  receiptUrl: string | null;
  repaidAt: string | null;
  createdAt: string;
}

export interface LoanSummary {
  totalLent: number;
  totalRepaid: number;
  outstanding: number;
  overdueAmount: number;
  counts: { total: number; pending: number; overdue: number; repaid: number };
}

export interface ReceiptAsset {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}

export interface NewLoan {
  friendName: string;
  amount: number;
  dueDate: string;
  note: string;
  receipt: ReceiptAsset | null;
}

async function createLoan({ receipt, ...fields }: NewLoan): Promise<Loan> {
  if (!receipt) {
    const { loan } = await apiRequest<{ loan: Loan }>('/api/loans', { method: 'POST', body: fields });
    return loan;
  }

  const form = new FormData();
  form.append('friendName', fields.friendName);
  form.append('amount', String(fields.amount));
  form.append('dueDate', fields.dueDate);
  if (fields.note) form.append('note', fields.note);
  form.append('receipt', await toFormFile(receipt.uri), receipt.fileName ?? 'receipt.jpg');

  const { loan } = await apiRequest<{ loan: Loan }>('/api/loans', { method: 'POST', body: form });
  return loan;
}

export const loansApi = {
  list: async (status: LoanFilter) =>
    (await apiRequest<{ loans: Loan[] }>(`/api/loans?status=${status}`)).loans,

  summary: () => apiRequest<LoanSummary>('/api/loans/summary'),

  create: createLoan,

  markRepaid: async (id: number) =>
    (await apiRequest<{ loan: Loan }>(`/api/loans/${id}/repay`, { method: 'PATCH' })).loan,

  remove: (id: number) => apiRequest<void>(`/api/loans/${id}`, { method: 'DELETE' }),
};
