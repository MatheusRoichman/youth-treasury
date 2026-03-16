'use client';

import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { MemberAvatar } from '@/components/member-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { transactionKeys } from '@/lib/queries/transactions';
import {
  fetchTransactions,
  type TransactionFilters,
  type TransactionListResult,
} from '@/lib/services/transactions/fetch-transactions';
import { formatCurrency, formatDate } from '@/lib/utils';
import { NewTransactionDialog } from './new-transaction-dialog';

const CATEGORY_LABELS: Record<string, string> = {
  MONTHLY_FEE: 'Mensalidade',
  OFFERING: 'Oferta',
  EXPENSE: 'Despesa',
  OTHER: 'Outro',
};

interface ActiveMember {
  id: string;
  name: string;
  initials: string;
}

interface ActiveCampaign {
  id: string;
  name: string;
  type: string;
  memberIds: string[];
}

interface CampaignOption {
  id: string;
  name: string;
  type: string;
}

interface Props {
  initialData: TransactionListResult;
  activeMembers: ActiveMember[];
  activeCampaigns: ActiveCampaign[];
  allCampaigns: CampaignOption[];
}

export function TransactionsTable({
  initialData,
  activeMembers,
  activeCampaigns,
  allCampaigns,
}: Props) {
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const filters: TransactionFilters = useMemo(
    () => ({
      page,
      type: type || undefined,
      category: category || undefined,
      campaignId: campaignId || undefined,
      dateStart: dateStart || undefined,
      dateEnd: dateEnd || undefined,
      search: search || undefined,
    }),
    [page, type, category, campaignId, dateStart, dateEnd, search],
  );

  const { data, isLoading } = useQuery<TransactionListResult>({
    queryKey: transactionKeys.list(filters),
    queryFn: () => fetchTransactions(filters),
    initialData:
      page === 1 &&
      !type &&
      !category &&
      !campaignId &&
      !dateStart &&
      !dateEnd &&
      !search
        ? initialData
        : undefined,
    placeholderData: (prev) => prev,
  });

  const result = data ?? initialData;
  const totalPages = Math.ceil(result.total / result.limit);
  const from = result.total === 0 ? 0 : (result.page - 1) * result.limit + 1;
  const to = Math.min(result.page * result.limit, result.total);

  function resetFilters() {
    setPage(1);
    setType('');
    setCategory('');
    setCampaignId('');
    setDateStart('');
    setDateEnd('');
    setSearch('');
    setSearchInput('');
  }

  const hasFilters = !!(
    type ||
    category ||
    campaignId ||
    dateStart ||
    dateEnd ||
    search
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Histórico completo de entradas e saídas
          </p>
        </div>
        <NewTransactionDialog
          activeMembers={activeMembers}
          activeCampaigns={activeCampaigns}
        />
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* Type */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500">Tipo</p>
            <Select
              value={type || '__all__'}
              onValueChange={(v) => {
                setType(v === '__all__' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                <SelectItem value="CONTRIBUTION">Contribuições</SelectItem>
                <SelectItem value="EXPENSE">Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500">Categoria</p>
            <Select
              value={category || '__all__'}
              onValueChange={(v) => {
                setCategory(v === '__all__' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campaign */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500">Campanha</p>
            <Select
              value={campaignId || '__all__'}
              onValueChange={(v) => {
                setCampaignId(v === '__all__' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {allCampaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date start */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500">De</p>
            <Input
              type="date"
              value={dateStart}
              onChange={(e) => {
                setDateStart(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Date end */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500">Até</p>
            <Input
              type="date"
              value={dateEnd}
              onChange={(e) => {
                setDateEnd(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Search */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500">
              Membro / Doador / Fornecedor
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(searchInput);
                setPage(1);
              }}
            >
              <Input
                placeholder="Buscar..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onBlur={() => {
                  setSearch(searchInput);
                  setPage(1);
                }}
              />
            </form>
          </div>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-primary hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                Descrição
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                Categoria
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                Membro / Doador
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                Campanha
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                Data
              </th>
              <th className="px-6 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                Valor
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading &&
              [...Array(5)].map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                <tr key={i}>
                  {[...Array(6)].map((__, j) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            {!isLoading && result.transactions.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-14 text-center text-sm text-gray-400"
                >
                  {hasFilters
                    ? 'Nenhuma transação encontrada com estes filtros.'
                    : 'Nenhuma transação registrada ainda.'}
                </td>
              </tr>
            )}
            {!isLoading &&
              result.transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  {/* Description */}
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          tx.type === 'CONTRIBUTION' ? 'success' : 'danger'
                        }
                      >
                        {tx.type === 'CONTRIBUTION' ? 'Entrada' : 'Saída'}
                      </Badge>
                      <span className="text-gray-700">{tx.description}</span>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    <Badge variant="neutral">
                      {CATEGORY_LABELS[tx.category] ?? tx.category}
                    </Badge>
                  </td>

                  {/* Member / Donor */}
                  <td className="px-4 py-3">
                    {tx.member ? (
                      <div className="flex items-center gap-2">
                        <MemberAvatar
                          name={tx.member.name}
                          initials={tx.member.initials}
                          size="sm"
                        />
                        <span className="text-sm text-gray-700">
                          {tx.member.name}
                        </span>
                      </div>
                    ) : tx.donorName ? (
                      <span className="text-sm text-gray-600">
                        {tx.donorName}
                      </span>
                    ) : tx.vendorName ? (
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
                          <ShoppingCart className="h-3 w-3 text-gray-400" />
                        </span>
                        <span className="text-sm text-gray-600">
                          {tx.vendorName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>

                  {/* Campaign */}
                  <td className="px-4 py-3">
                    {tx.campaign ? (
                      <span className="text-sm text-gray-700">
                        {tx.campaign.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Caixa Geral</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {formatDate(new Date(tx.date))}
                  </td>

                  {/* Amount */}
                  <td
                    className={`px-6 py-3 text-right font-semibold ${
                      tx.type === 'CONTRIBUTION'
                        ? 'text-green-600'
                        : 'text-red-500'
                    }`}
                  >
                    {tx.type === 'CONTRIBUTION' ? '+' : '-'}
                    {formatCurrency(Number(tx.amount))}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Pagination */}
        {result.total > 0 && (
          <div className="flex items-center justify-between border-t px-6 py-3 text-sm text-gray-500">
            <span>
              Exibindo {from}–{to} de {result.total} transações
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-xs">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
