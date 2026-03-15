import { http } from '../http';

export interface TransactionListItemDTO {
  id: string;
  type: 'CONTRIBUTION' | 'EXPENSE';
  category: string;
  description: string;
  amount: string;
  date: string;
  createdAt: string;
  memberId: string | null;
  donorName: string | null;
  vendorName: string | null;
  campaignId: string | null;
  member: { id: string; name: string; initials: string } | null;
  campaign: { id: string; name: string; type: string } | null;
}

export interface TransactionListResult {
  transactions: TransactionListItemDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface TransactionFilters {
  page?: number;
  type?: string;
  category?: string;
  campaignId?: string;
  dateStart?: string;
  dateEnd?: string;
  search?: string;
}

export async function fetchTransactions(
  filters: TransactionFilters = {},
): Promise<TransactionListResult> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.type) params.set('type', filters.type);
  if (filters.category) params.set('category', filters.category);
  if (filters.campaignId) params.set('campaignId', filters.campaignId);
  if (filters.dateStart) params.set('dateStart', filters.dateStart);
  if (filters.dateEnd) params.set('dateEnd', filters.dateEnd);
  if (filters.search) params.set('search', filters.search);

  const qs = params.toString();
  const { data } = await http.get<TransactionListResult>(
    `/transactions${qs ? `?${qs}` : ''}`,
  );
  return data;
}
