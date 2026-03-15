import { Info, TrendingDown, TrendingUp } from 'lucide-react';
import { RecentActivities } from '@/components/dashboard/recent-activities';
import {
  getCurrentBalance,
  getMonthSummary,
  getRecentTransactions,
} from '@/lib/db/dashboard';
import { formatCurrency } from '@/lib/utils';

export default async function DashboardPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const [balance, summary, prevSummary, recentTransactions] = await Promise.all([
    getCurrentBalance(),
    getMonthSummary(year, month),
    getMonthSummary(prevYear, prevMonth),
    getRecentTransactions(10),
  ]);

  const inChange =
    prevSummary.totalIn > 0
      ? ((summary.totalIn - prevSummary.totalIn) / prevSummary.totalIn) * 100
      : null;

  const outChange =
    prevSummary.totalOut > 0
      ? ((summary.totalOut - prevSummary.totalOut) / prevSummary.totalOut) * 100
      : null;

  const serializedTransactions = recentTransactions.map((tx) => ({
    ...tx,
    amount: tx.amount.toString(),
    date: tx.date.toISOString(),
    createdAt: tx.createdAt.toISOString(),
    campaign: tx.campaign ?? null,
  }));

  return (
    <div className="flex flex-col min-h-full">
      <main className="flex-1 p-6 space-y-5 bg-gray-50">
        {/* Balance hero card */}
        <div className="rounded-2xl bg-primary px-8 py-8 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 opacity-70" />
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70">
              Saldo Atual
            </p>
          </div>
          <p className="text-5xl font-extrabold tracking-tight">
            {formatCurrency(balance)}
          </p>
          <p className="mt-3 text-sm opacity-60">
            Disponível em caixa para atividades do departamento
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Entradas */}
          <div className="rounded-xl border bg-white p-5 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Entradas do Mês
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalIn)}
              </p>
              {inChange !== null && (
                <p
                  className={`mt-1 flex items-center gap-1 text-xs font-semibold ${inChange >= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  <TrendingUp className="h-3 w-3" />
                  {inChange >= 0 ? '+' : ''}
                  {inChange.toFixed(0)}% vs mês anterior
                </p>
              )}
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </div>

          {/* Saídas */}
          <div className="rounded-xl border bg-white p-5 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Saídas do Mês</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalOut)}
              </p>
              {outChange !== null && (
                <p
                  className={`mt-1 flex items-center gap-1 text-xs font-semibold ${outChange <= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  <TrendingDown className="h-3 w-3" />
                  {outChange >= 0 ? '+' : ''}
                  {outChange.toFixed(0)}% vs mês anterior
                </p>
              )}
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100">
              <TrendingDown className="h-5 w-5 text-red-400" />
            </div>
          </div>
        </div>

        {/* Recent activities */}
        <RecentActivities initialData={serializedTransactions} />
      </main>
    </div>
  );
}
