import { CalendarDays } from 'lucide-react';
import { ContributionsTable } from '@/components/contributions/contributions-table';
import { OpenMonthDialog } from '@/components/contributions/open-month-dialog';
import { Badge } from '@/components/ui/badge';
import { getActiveCycleWithContributions } from '@/lib/db/contributions';
import { getSettings } from '@/lib/db/settings';

export default async function ContributionsPage() {
  const [cycleRaw, settings] = await Promise.all([
    getActiveCycleWithContributions(),
    getSettings(),
  ]);

  const defaultGoal = Number(settings.memberContributionAmount);

  const cycle = cycleRaw
    ? {
        ...cycleRaw,
        goalAmount: cycleRaw.goalAmount.toString(),
        createdAt: cycleRaw.createdAt.toISOString(),
        contributions: cycleRaw.contributions.map((c) => ({
          ...c,
          amount: c.amount?.toString() ?? null,
          paidAt: c.paidAt?.toISOString() ?? null,
          createdAt: c.createdAt.toISOString(),
        })),
      }
    : null;

  return (
    <div className="flex flex-col min-h-full">
      <main className="flex-1 p-6 space-y-6 bg-gray-50">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">
                {cycle ? `Mensalidade ${cycle.label}` : 'Contribuições'}
              </h2>
              {cycle?.isActive && (
                <Badge className="text-xs tracking-wide">MÊS ATIVO</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-400">
              Acompanhamento de arrecadação do departamento de jovens
            </p>
          </div>
          <OpenMonthDialog defaultGoal={defaultGoal} />
        </div>

        {cycle ? (
          <ContributionsTable initialCycle={cycle} defaultGoal={defaultGoal} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-20 text-center shadow-sm">
            <CalendarDays className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700">
              Nenhum mês ativo
            </h3>
            <p className="mt-1 mb-6 text-sm text-gray-400">
              Abra um novo mês para começar a registrar contribuições.
            </p>
            <OpenMonthDialog
              defaultGoal={defaultGoal}
              trigger={
                <button
                  type="button"
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
                >
                  Abrir Mês
                </button>
              }
            />
          </div>
        )}
      </main>
    </div>
  );
}
