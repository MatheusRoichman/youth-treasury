'use client';

import { ShoppingCart } from 'lucide-react';
import { MemberAvatar } from '@/components/member-avatar';
import { Badge } from '@/components/ui/badge';
import type { CampaignTransactionDTO } from '@/lib/services/campaigns/fetch-campaign-detail';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Props {
  transactions: CampaignTransactionDTO[];
  filterMemberId?: string | null;
}

export function CampaignTransactionsTable({
  transactions,
  filterMemberId,
}: Props) {
  const filtered = filterMemberId
    ? transactions.filter((tx) => tx.memberId === filterMemberId)
    : transactions;

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h3 className="font-semibold text-gray-900">
          Transações
          {filterMemberId && (
            <span className="ml-2 text-xs font-normal text-primary">
              (filtrado por membro)
            </span>
          )}
        </h3>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
              Descrição
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
              Membro / Doador
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
          {filtered.length === 0 && (
            <tr>
              <td
                colSpan={4}
                className="py-10 text-center text-sm text-gray-400"
              >
                Nenhuma transação registrada
              </td>
            </tr>
          )}
          {filtered.map((tx) => (
            <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
              <td className="px-6 py-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={tx.type === 'CONTRIBUTION' ? 'success' : 'danger'}
                  >
                    {tx.type === 'CONTRIBUTION' ? 'Entrada' : 'Saída'}
                  </Badge>
                  <span className="text-gray-700">{tx.description}</span>
                </div>
              </td>
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
                  <span className="text-sm text-gray-600">{tx.donorName}</span>
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
              <td className="px-4 py-3 text-sm text-gray-400">
                {formatDate(tx.date)}
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
        </tbody>
      </table>
    </div>
  );
}
