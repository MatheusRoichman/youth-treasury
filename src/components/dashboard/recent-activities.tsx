'use client';

import { useQuery } from '@tanstack/react-query';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { MemberAvatar } from '@/components/member-avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardKeys } from '@/lib/queries/dashboard';
import {
  fetchRecentTransactions,
  type TransactionDTO,
} from '@/lib/services/dashboard/fetch-recent-transactions';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Props {
  initialData: TransactionDTO[];
}

export function RecentActivities({ initialData }: Props) {
  const { data: transactions = initialData, isLoading } = useQuery<
    TransactionDTO[]
  >({
    queryKey: dashboardKeys.recent(),
    queryFn: fetchRecentTransactions,
    initialData,
  });

  if (isLoading && !initialData.length) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="font-semibold text-gray-900">Atividades Recentes</h2>
        <Link
          href="/campaigns"
          className="text-sm font-medium text-primary hover:underline"
        >
          Ver campanhas
        </Link>
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-t border-b bg-gray-50">
            <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
              Membro / Descrição
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
              Campanha
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
              Tipo
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
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
              <td className="px-6 py-3">
                <div className="flex items-center gap-3">
                  {tx.member ? (
                    <MemberAvatar
                      name={tx.member.name}
                      initials={tx.member.initials}
                      size="sm"
                    />
                  ) : (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <ShoppingCart className="h-3.5 w-3.5 text-gray-400" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {tx.member?.name ?? tx.vendorName ?? tx.description}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {tx.description}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                {tx.campaign ? (
                  <Link
                    href={`/campaigns/${tx.campaign.id}`}
                    className="text-xs text-primary hover:underline truncate max-w-[120px] block"
                  >
                    {tx.campaign.name}
                  </Link>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={tx.type === 'CONTRIBUTION' ? 'success' : 'danger'}
                >
                  {tx.type === 'CONTRIBUTION' ? 'Contribuição' : 'Despesa'}
                </Badge>
              </td>
              <td className="px-4 py-3 text-gray-400">
                {formatDate(new Date(tx.date))}
              </td>
              <td
                className={`px-6 py-3 text-right font-semibold ${
                  tx.type === 'CONTRIBUTION' ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {tx.type === 'CONTRIBUTION' ? '+' : '-'}
                {formatCurrency(Number(tx.amount))}
              </td>
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="py-10 text-center text-sm text-gray-400"
              >
                Nenhuma atividade recente
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
