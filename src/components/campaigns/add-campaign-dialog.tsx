'use client';

import { useEffect, useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCampaignAction } from '@/lib/actions/campaigns';
import { campaignKeys } from '@/lib/queries/campaigns';
import { formatCurrency } from '@/lib/utils';

interface MemberOption {
  id: string;
  name: string;
  initials: string;
}

interface Props {
  trigger: React.ReactNode;
  activeMembers: MemberOption[];
}

type CampaignType = 'MONTHLY_FEE' | 'FUNDRAISER';

const monthlyFeeSchema = z.object({
  type: z.literal('MONTHLY_FEE'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  startDate: z.string().min(1, 'Data de início obrigatória'),
  endDate: z.string().optional(),
  expectedAmountPerMember: z.number().positive('Valor por membro deve ser positivo'),
  memberIds: z.array(z.string()).min(1, 'Selecione ao menos um membro'),
});

const fundraiserSchema = z.object({
  type: z.literal('FUNDRAISER'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  startDate: z.string().min(1, 'Data de início obrigatória'),
  endDate: z.string().optional(),
  goalAmount: z.number().positive('Meta deve ser positiva'),
  memberIds: z.array(z.string()),
});

export function AddCampaignDialog({ trigger, activeMembers }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [campaignType, setCampaignType] = useState<CampaignType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Shared fields
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState('');

  // Monthly fee fields
  const [expectedAmountPerMember, setExpectedAmountPerMember] = useState(20);
  const [selectAll, setSelectAll] = useState(true);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set(activeMembers.map((m) => m.id)),
  );
  const [memberSearch, setMemberSearch] = useState('');

  // Fundraiser fields
  const [goalAmount, setGoalAmount] = useState<number>(0);
  const [fundraiserMemberIds, setFundraiserMemberIds] = useState<Set<string>>(
    new Set(),
  );
  const [fundraiserSearch, setFundraiserSearch] = useState('');

  const filteredForMonthly = useMemo(
    () =>
      activeMembers.filter((m) =>
        m.name.toLowerCase().includes(memberSearch.toLowerCase()),
      ),
    [activeMembers, memberSearch],
  );

  const filteredForFundraiser = useMemo(
    () =>
      activeMembers.filter((m) =>
        m.name.toLowerCase().includes(fundraiserSearch.toLowerCase()),
      ),
    [activeMembers, fundraiserSearch],
  );

  // Sync selectAll ↔ selectedMemberIds
  useEffect(() => {
    if (selectAll) {
      setSelectedMemberIds(new Set(activeMembers.map((m) => m.id)));
    }
  }, [selectAll, activeMembers]);

  function toggleMonthlyMember(id: string) {
    setSelectAll(false);
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleFundraiserMember(id: string) {
    setFundraiserMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetForm() {
    setStep(1);
    setCampaignType(null);
    setName('');
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate('');
    setExpectedAmountPerMember(20);
    setSelectAll(true);
    setSelectedMemberIds(new Set(activeMembers.map((m) => m.id)));
    setMemberSearch('');
    setGoalAmount(0);
    setFundraiserMemberIds(new Set());
    setFundraiserSearch('');
    setErrors({});
  }

  async function handleSubmit() {
    setErrors({});

    if (campaignType === 'MONTHLY_FEE') {
      const result = monthlyFeeSchema.safeParse({
        type: 'MONTHLY_FEE',
        name,
        startDate,
        endDate: endDate || undefined,
        expectedAmountPerMember,
        memberIds: Array.from(selectedMemberIds),
      });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
        setErrors(fieldErrors);
        return;
      }
    } else {
      const result = fundraiserSchema.safeParse({
        type: 'FUNDRAISER',
        name,
        startDate,
        endDate: endDate || undefined,
        goalAmount,
        memberIds: Array.from(fundraiserMemberIds),
      });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
        setErrors(fieldErrors);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload =
        campaignType === 'MONTHLY_FEE'
          ? {
              type: 'MONTHLY_FEE' as const,
              name,
              startDate,
              endDate: endDate || undefined,
              expectedAmountPerMember,
              memberIds: Array.from(selectedMemberIds),
            }
          : {
              type: 'FUNDRAISER' as const,
              name,
              startDate,
              endDate: endDate || undefined,
              goalAmount,
              memberIds: Array.from(fundraiserMemberIds),
            };

      const res = await createCampaignAction(payload);
      if (res.success) {
        toast.success('Campanha criada com sucesso!');
        queryClient.invalidateQueries({ queryKey: campaignKeys.all });
        setOpen(false);
        resetForm();
      } else {
        toast.error(res.error ?? 'Erro ao criar campanha');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const monthlyGoal =
    campaignType === 'MONTHLY_FEE'
      ? expectedAmountPerMember * selectedMemberIds.size
      : 0;

  const fundraiserPerMember =
    campaignType === 'FUNDRAISER' && fundraiserMemberIds.size > 0
      ? goalAmount / fundraiserMemberIds.size
      : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? 'Nova Campanha'
              : campaignType === 'MONTHLY_FEE'
                ? 'Mensalidade'
                : 'Arrecadação'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Choose type */}
        {step === 1 && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-500">Escolha o tipo de campanha:</p>
            <button
              type="button"
              onClick={() => {
                setCampaignType('MONTHLY_FEE');
                setStep(2);
              }}
              className="w-full rounded-xl border-2 border-transparent bg-blue-50 p-4 text-left hover:border-blue-400 transition-colors"
            >
              <p className="font-semibold text-blue-700">Mensalidade</p>
              <p className="mt-1 text-sm text-blue-500">
                Controle de contribuições mensais dos membros ativos
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setCampaignType('FUNDRAISER');
                setStep(2);
              }}
              className="w-full rounded-xl border-2 border-transparent bg-purple-50 p-4 text-left hover:border-purple-400 transition-colors"
            >
              <p className="font-semibold text-purple-700">Arrecadação</p>
              <p className="mt-1 text-sm text-purple-500">
                Campanha para arrecadar fundos para um objetivo específico
              </p>
            </button>
          </div>
        )}

        {/* Step 2: MONTHLY_FEE form */}
        {step === 2 && campaignType === 'MONTHLY_FEE' && (
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome da Campanha *</Label>
              <Input
                className="mt-1"
                placeholder="Ex: Mensalidade Março 2025"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data Início *</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                {errors.startDate && (
                  <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>
                )}
              </div>
              <div>
                <Label>Data Fim (opcional)</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Valor por Membro (R$) *</Label>
              <Input
                className="mt-1"
                type="number"
                min={0}
                step={0.01}
                value={expectedAmountPerMember}
                onChange={(e) =>
                  setExpectedAmountPerMember(Number(e.target.value))
                }
              />
              {errors.expectedAmountPerMember && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.expectedAmountPerMember}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Membros</Label>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => {
                      setSelectAll(e.target.checked);
                      if (e.target.checked) {
                        setSelectedMemberIds(
                          new Set(activeMembers.map((m) => m.id)),
                        );
                      } else {
                        setSelectedMemberIds(new Set());
                      }
                    }}
                    className="rounded"
                  />
                  Todos os membros ativos
                </label>
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <Input
                  className="pl-8 h-8 text-sm"
                  placeholder="Buscar membro..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>
              <div className="max-h-40 overflow-y-auto rounded-lg border divide-y">
                {filteredForMonthly.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.has(m.id)}
                      onChange={() => toggleMonthlyMember(m.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">{m.name}</span>
                  </label>
                ))}
              </div>
              {errors.memberIds && (
                <p className="mt-1 text-xs text-red-500">{errors.memberIds}</p>
              )}
            </div>

            <div className="rounded-lg bg-blue-50 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">
                Meta total ({selectedMemberIds.size} membros)
              </span>
              <span className="text-lg font-bold text-blue-700">
                {formatCurrency(monthlyGoal)}
              </span>
            </div>
          </div>
        )}

        {/* Step 2: FUNDRAISER form */}
        {step === 2 && campaignType === 'FUNDRAISER' && (
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome da Campanha *</Label>
              <Input
                className="mt-1"
                placeholder="Ex: Retiro Jovem 2025"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <Label>Meta (R$) *</Label>
              <Input
                className="mt-1"
                type="number"
                min={0}
                step={0.01}
                placeholder="2000.00"
                value={goalAmount || ''}
                onChange={(e) => setGoalAmount(Number(e.target.value))}
              />
              {errors.goalAmount && (
                <p className="mt-1 text-xs text-red-500">{errors.goalAmount}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data Início *</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                {errors.startDate && (
                  <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>
                )}
              </div>
              <div>
                <Label>Data Fim (opcional)</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Membros (opcional)</Label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <Input
                  className="pl-8 h-8 text-sm"
                  placeholder="Buscar membro..."
                  value={fundraiserSearch}
                  onChange={(e) => setFundraiserSearch(e.target.value)}
                />
              </div>
              <div className="max-h-40 overflow-y-auto rounded-lg border divide-y">
                {filteredForFundraiser.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={fundraiserMemberIds.has(m.id)}
                      onChange={() => toggleFundraiserMember(m.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">{m.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {fundraiserPerMember !== null && (
              <div className="rounded-lg bg-purple-50 px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-purple-700">
                  Valor por membro ({fundraiserMemberIds.size} membros)
                </span>
                <span className="text-lg font-bold text-purple-700">
                  {formatCurrency(fundraiserPerMember)}
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 2 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="mr-auto"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
          >
            Cancelar
          </Button>
          {step === 2 && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Criando...' : 'Criar Campanha'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
