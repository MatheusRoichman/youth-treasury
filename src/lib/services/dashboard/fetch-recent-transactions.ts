import { http } from '../http';

export interface TransactionDTO {
  id: string;
  type: 'CONTRIBUTION' | 'EXPENSE';
  description: string;
  amount: string;
  date: string;
  createdAt: string;
  member: { id: string; name: string; initials: string } | null;
  vendorName: string | null;
  campaign: { id: string; name: string } | null;
}

export async function fetchRecentTransactions(): Promise<TransactionDTO[]> {
  const { data } = await http.get<TransactionDTO[]>('/dashboard/recent');
  return data;
}
