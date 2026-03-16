import { Megaphone, Plus } from 'lucide-react';
import Link from 'next/link';
import { AddCampaignDialog } from '@/components/campaigns/add-campaign-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getCampaigns } from '@/lib/db/campaigns';
import { getActiveMembers } from '@/lib/db/members';
import { formatCurrency, formatDate } from '@/lib/utils';

const TYPE_LABELS = {
  MONTHLY_FEE: 'Mensalidade',
  FUNDRAISER: 'Arrecadação',
};

const TYPE_BADGE_VARIANTS = {
  MONTHLY_FEE: 'default' as const,
  FUNDRAISER: 'secondary' as const,
};

const STATUS_LABELS = {
  ACTIVE: 'Ativo',
  CLOSED: 'Encerrado',
  ARCHIVED: 'Arquivado',
};

const STATUS_VARIANTS = {
  ACTIVE: 'success' as const,
  CLOSED: 'neutral' as const,
  ARCHIVED: 'neutral' as const,
};

export default async function CampaignsPage() {
  const [campaignsRaw, activeMembers] = await Promise.all([
    getCampaigns(),
    getActiveMembers(),
  ]);

  const campaigns = campaignsRaw.map((c) => ({
    ...c,
    goalAmount: Number(c.goalAmount),
    startDate: c.startDate.toISOString(),
    endDate: c.endDate?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    totalRaised: c.transactions.reduce((sum, tx) => sum + Number(tx.amount), 0),
  }));

  const active = campaigns.filter((c) => c.status === 'ACTIVE');
  const closed = campaigns.filter((c) => c.status !== 'ACTIVE');

  const memberOptions = activeMembers.map((m) => ({
    id: m.id,
    name: m.name,
    initials: m.initials,
  }));

  return (
    <div className="flex flex-col min-h-full">
      <main className="flex-1 p-6 space-y-6 bg-gray-50">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Campanhas</h2>
            <p className="mt-1 text-sm text-gray-400">
              Gerencie mensalidades e arrecadações do departamento
            </p>
          </div>
          <AddCampaignDialog
            activeMembers={memberOptions}
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Campanha
              </Button>
            }
          />
        </div>

        {/* Active campaigns */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Ativas
          </h3>
          {active.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-14 text-center shadow-sm">
              <Megaphone className="mb-4 h-10 w-10 text-gray-300" />
              <p className="font-semibold text-gray-600">
                Nenhuma campanha ativa
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Crie uma nova campanha para começar.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          )}
        </section>

        {/* Closed / Archived campaigns */}
        {closed.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              Encerradas / Arquivadas
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {closed.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function CampaignCard({
  campaign,
}: {
  campaign: {
    id: string;
    name: string;
    type: 'MONTHLY_FEE' | 'FUNDRAISER';
    goalAmount: number;
    startDate: string;
    endDate: string | null;
    status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
    totalRaised: number;
  };
}) {
  const progress =
    campaign.goalAmount > 0
      ? Math.min(100, (campaign.totalRaised / campaign.goalAmount) * 100)
      : 0;

  return (
    <div className="flex flex-col rounded-xl border bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {campaign.name}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge
              variant={TYPE_BADGE_VARIANTS[campaign.type]}
              className={
                campaign.type === 'FUNDRAISER'
                  ? 'bg-purple-100 text-purple-700'
                  : ''
              }
            >
              {TYPE_LABELS[campaign.type]}
            </Badge>
            <Badge variant={STATUS_VARIANTS[campaign.status]}>
              {STATUS_LABELS[campaign.status]}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Arrecadado</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(campaign.totalRaised)}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{progress.toFixed(1)}%</span>
          <span>Meta: {formatCurrency(campaign.goalAmount)}</span>
        </div>
      </div>

      <div className="text-xs text-gray-400 space-y-0.5">
        <p>Início: {formatDate(new Date(campaign.startDate))}</p>
        {campaign.endDate && (
          <p>Fim: {formatDate(new Date(campaign.endDate))}</p>
        )}
      </div>

      <Link
        href={`/campaigns/${campaign.id}`}
        className="mt-auto inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Ver detalhes
      </Link>
    </div>
  );
}
