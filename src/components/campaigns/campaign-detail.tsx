'use client';

import { useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AddMemberDialog } from '@/components/campaigns/add-member-dialog';
import { CampaignMembersTable } from '@/components/campaigns/campaign-members-table';
import { CampaignTransactionsTable } from '@/components/campaigns/campaign-transactions-table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { updateCampaignStatusAction } from '@/lib/actions/campaigns';
import { campaignKeys } from '@/lib/queries/campaigns';
import {
  type CampaignDetailDTO,
  fetchCampaignDetail,
} from '@/lib/services/campaigns/fetch-campaign-detail';
import { formatCurrency, formatDate } from '@/lib/utils';

const TYPE_LABELS = {
  MONTHLY_FEE: 'Mensalidade',
  FUNDRAISER: 'Arrecadação',
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

interface AvailableMember {
  id: string;
  name: string;
  initials: string;
}

interface Props {
  initialData: CampaignDetailDTO;
  availableMembers: AvailableMember[];
}

export function CampaignDetail({ initialData, availableMembers }: Props) {
  const queryClient = useQueryClient();
  const [filterMemberId, setFilterMemberId] = useState<string | null>(null);

  const { data: campaign = initialData, isLoading } =
    useQuery<CampaignDetailDTO>({
      queryKey: campaignKeys.detail(initialData.id),
      queryFn: () =>
        fetchCampaignDetail(initialData.id) as Promise<CampaignDetailDTO>,
      initialData,
    });

  const closeCampaign = useMutation({
    mutationFn: () => updateCampaignStatusAction(campaign.id, 'CLOSED'),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Campanha encerrada!');
        queryClient.invalidateQueries({
          queryKey: campaignKeys.detail(campaign.id),
        });
        queryClient.invalidateQueries({ queryKey: campaignKeys.list() });
      } else {
        toast.error(res.error ?? 'Erro ao encerrar campanha');
      }
    },
    onError: () => toast.error('Erro ao encerrar campanha'),
  });

  const goal = Number(campaign.goalAmount);
  const progress =
    goal > 0 ? Math.min(100, (campaign.totalRaised / goal) * 100) : 0;

  if (isLoading && !initialData) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-gray-900">
              {campaign.name}
            </h2>
            <Badge
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
          <p className="mt-1 text-sm text-gray-400">
            Início: {formatDate(new Date(campaign.startDate))}
            {campaign.endDate &&
              ` · Fim: ${formatDate(new Date(campaign.endDate))}`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/campaigns"
            className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
          >
            ← Campanhas
          </Link>
          {campaign.type === 'FUNDRAISER' && campaign.status === 'ACTIVE' && (
            <AddMemberDialog
              campaignId={campaign.id}
              goalAmount={Number(campaign.goalAmount)}
              currentMemberCount={campaign.campaignMembers.length}
              availableMembers={availableMembers}
            />
          )}
          {campaign.status === 'ACTIVE' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Encerrar Campanha
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Encerrar campanha?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A campanha será marcada como encerrada e não aceitará novos
                    pagamentos. Esta ação não pode ser desfeita facilmente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => closeCampaign.mutate()}
                    disabled={closeCampaign.isPending}
                  >
                    Encerrar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Progress card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Total Arrecadado
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(campaign.totalRaised)}
          </p>
          <p className="mt-1 text-xs font-medium text-green-500">
            {progress.toFixed(1)}% da meta
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Meta
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(goal)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Faltam {formatCurrency(Math.max(0, goal - campaign.totalRaised))}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Progresso
            </p>
            <span className="text-sm font-bold text-primary">
              {progress.toFixed(1)}%
            </span>
          </div>
          <Progress value={progress} className="h-2.5" />
          <div className="mt-2 flex justify-between text-xs text-gray-400">
            <span>0%</span>
            <span>META</span>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Saldo da Campanha
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${campaign.campaignBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}
          >
            {formatCurrency(campaign.campaignBalance)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Contribuições menos despesas
          </p>
        </div>
      </div>

      {/* Members table */}
      <CampaignMembersTable
        campaignId={campaign.id}
        campaignType={campaign.type}
        members={campaign.campaignMembers}
        filterMemberId={filterMemberId}
        onFilterMember={setFilterMemberId}
      />

      {/* Transactions table */}
      <CampaignTransactionsTable
        transactions={campaign.transactions}
        filterMemberId={filterMemberId}
      />

      {/* MONTHLY_FEE info box */}
      {campaign.type === 'MONTHLY_FEE' && (
        <div className="flex gap-4 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Info className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">
              Sobre a Isenção
            </p>
            <p className="mt-0.5 text-sm text-blue-700">
              A opção <strong>Isentar</strong> deve ser utilizada exclusivamente
              para membros que comprovadamente não possuem condições financeiras
              para a contribuição mensal, garantindo que ninguém seja excluído
              das atividades por motivos econômicos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
