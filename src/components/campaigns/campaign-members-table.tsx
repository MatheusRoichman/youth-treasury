'use client';

import { useMemo, useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  EXEMPTION_CATEGORY_LABELS,
  ExemptMemberDialog,
} from '@/components/campaigns/exempt-member-dialog';
import { RegisterPaymentDialog } from '@/components/campaigns/register-payment-dialog';
import { MemberAvatar } from '@/components/member-avatar';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { setMemberExemptAction } from '@/lib/actions/campaignMembers';
import { campaignKeys } from '@/lib/queries/campaigns';
import type { CampaignMemberDTO } from '@/lib/services/campaigns/fetch-campaign-detail';
import { formatCurrency } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Pago',
  PARTIAL: 'Parcial',
  PENDING: 'Pendente',
  EXEMPT: 'Isento',
};

const STATUS_VARIANTS: Record<
  string,
  'success' | 'warning' | 'danger' | 'neutral'
> = {
  PAID: 'success',
  PARTIAL: 'warning',
  PENDING: 'danger',
  EXEMPT: 'neutral',
};

interface Props {
  campaignId: string;
  campaignType: 'MONTHLY_FEE' | 'FUNDRAISER';
  members: CampaignMemberDTO[];
  filterMemberId?: string | null;
  onFilterMember?: (id: string | null) => void;
}

export function CampaignMembersTable({
  campaignId,
  campaignType,
  members,
  filterMemberId,
  onFilterMember,
}: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const removeExempt = useMutation({
    mutationFn: (memberId: string) =>
      setMemberExemptAction(campaignId, memberId, false),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Isenção removida!');
        queryClient.invalidateQueries({
          queryKey: campaignKeys.detail(campaignId),
        });
      } else {
        toast.error(res.error ?? 'Erro ao remover isenção');
      }
    },
    onError: () => toast.error('Erro ao remover isenção'),
  });

  const filtered = useMemo(
    () =>
      members.filter((m) =>
        m.member.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [members, search],
  );

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h3 className="font-semibold text-gray-900">Membros</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar membro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 max-w-[200px] h-8 text-sm"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Nome
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Valor Esperado
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Valor Pago
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Status
            </TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-10 text-center text-sm text-gray-400"
              >
                Nenhum membro encontrado
              </TableCell>
            </TableRow>
          )}
          {filtered.map((cm) => {
            const expected = Number(cm.expectedAmount);
            return (
              <TableRow
                key={cm.id}
                className={filterMemberId === cm.memberId ? 'bg-primary/5' : ''}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <MemberAvatar
                      name={cm.member.name}
                      initials={cm.member.initials}
                      size="sm"
                    />
                    <span className="font-medium text-gray-900">
                      {cm.member.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">
                  {formatCurrency(expected)}
                </TableCell>
                <TableCell className="font-medium text-green-600">
                  {formatCurrency(cm.paidAmount)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {cm.status === 'EXEMPT' &&
                    (cm.exemptionReason || cm.exemptionCategory) ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant={STATUS_VARIANTS[cm.status]}
                            className="cursor-help"
                          >
                            {STATUS_LABELS[cm.status]}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-64 space-y-1">
                          {cm.exemptionCategory && (
                            <p className="font-semibold">
                              {EXEMPTION_CATEGORY_LABELS[
                                cm.exemptionCategory
                              ] ?? cm.exemptionCategory}
                            </p>
                          )}
                          {cm.exemptionReason && (
                            <p className="text-gray-300 whitespace-pre-wrap">
                              {cm.exemptionReason}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge variant={STATUS_VARIANTS[cm.status]}>
                        {STATUS_LABELS[cm.status]}
                      </Badge>
                    )}
                    {cm.status === 'EXEMPT' && cm.exemptionCategory && (
                      <Badge variant="outline" className="text-xs">
                        {EXEMPTION_CATEGORY_LABELS[cm.exemptionCategory] ??
                          cm.exemptionCategory}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {(cm.status === 'PENDING' || cm.status === 'PARTIAL') && (
                    <div className="flex items-center justify-end gap-2">
                      <RegisterPaymentDialog
                        campaignId={campaignId}
                        campaignType={campaignType}
                        member={{
                          id: cm.memberId,
                          name: cm.member.name,
                        }}
                        expectedAmount={expected}
                        paidAmount={cm.paidAmount}
                        trigger={<Button size="sm">Registrar Pagamento</Button>}
                      />
                      <ExemptMemberDialog
                        trigger={
                          <Button size="sm" variant="outline">
                            Isentar
                          </Button>
                        }
                        campaignId={campaignId}
                        memberId={cm.memberId}
                        memberName={cm.member.name}
                      />
                    </div>
                  )}
                  {cm.status === 'PAID' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            onFilterMember?.(
                              filterMemberId === cm.memberId
                                ? null
                                : cm.memberId,
                            )
                          }
                        >
                          Ver Pagamentos
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {cm.status === 'EXEMPT' && (
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              Remover Isenção
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover isenção?</AlertDialogTitle>
                          <AlertDialogDescription>
                            A isenção de <strong>{cm.member.name}</strong> será
                            removida e o status voltará a Pendente. Esta ação
                            pode ser revertida isentando o membro novamente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeExempt.mutate(cm.memberId)}
                            disabled={removeExempt.isPending}
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
