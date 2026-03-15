'use client';

import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTransactionAction } from '@/lib/actions/transactions';
import { transactionKeys } from '@/lib/queries/transactions';

const CATEGORY_LABELS: Record<string, string> = {
  MONTHLY_FEE: 'Mensalidade',
  OFFERING: 'Oferta',
  EXPENSE: 'Despesa',
  OTHER: 'Outro',
};

const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  MONTHLY_FEE: 'Mensalidade',
  FUNDRAISER: 'Arrecadação',
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

interface Props {
  activeMembers: ActiveMember[];
  activeCampaigns: ActiveCampaign[];
}

type TxType = 'CONTRIBUTION' | 'EXPENSE';
type ContribSource = 'member' | 'external';

const today = new Date().toISOString().slice(0, 10);

export function NovaTransacaoDialog({ activeMembers, activeCampaigns }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [txType, setTxType] = useState<TxType>('CONTRIBUTION');
  const [source, setSource] = useState<ContribSource>('member');
  const [memberId, setMemberId] = useState('');
  const [donorName, setDonorName] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);

  function resetForm() {
    setTxType('CONTRIBUTION');
    setSource('member');
    setMemberId('');
    setDonorName('');
    setVendorName('');
    setCampaignId('');
    setCategory('');
    setDescription('');
    setAmount('');
    setDate(today);
  }

  // Inline warning: member selected + campaign selected + member not in campaign
  const selectedCampaign = activeCampaigns.find((c) => c.id === campaignId);
  const memberNotInCampaign =
    txType === 'CONTRIBUTION' &&
    source === 'member' &&
    !!memberId &&
    !!campaignId &&
    selectedCampaign != null &&
    !selectedCampaign.memberIds.includes(memberId);

  async function handleSubmit() {
    if (!description.trim()) {
      toast.error('Descrição obrigatória');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Valor deve ser positivo');
      return;
    }
    if (!date) {
      toast.error('Data obrigatória');
      return;
    }

    const effectiveCategory =
      txType === 'EXPENSE' ? 'EXPENSE' : category || 'OTHER';

    setSubmitting(true);
    try {
      const res = await createTransactionAction({
        type: txType,
        category: effectiveCategory,
        description: description.trim(),
        amount: Number(amount),
        date,
        memberId:
          txType === 'CONTRIBUTION' && source === 'member'
            ? memberId || undefined
            : undefined,
        donorName:
          txType === 'CONTRIBUTION' && source === 'external'
            ? donorName || undefined
            : undefined,
        vendorName: txType === 'EXPENSE' ? vendorName || undefined : undefined,
        campaignId: campaignId || undefined,
      });

      if (res.success) {
        toast.success('Transação registrada!');
        queryClient.invalidateQueries({ queryKey: transactionKeys.all });
        setOpen(false);
        resetForm();
      } else {
        toast.error(res.error ?? 'Erro ao registrar transação');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const contributionCategories =
    source === 'external'
      ? ['OFFERING', 'OTHER']
      : ['MONTHLY_FEE', 'OFFERING', 'OTHER'];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Type toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setTxType('CONTRIBUTION');
                setCategory('');
              }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                txType === 'CONTRIBUTION'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Contribuição
            </button>
            <button
              type="button"
              onClick={() => {
                setTxType('EXPENSE');
                setSource('member');
                setCategory('EXPENSE');
              }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                txType === 'EXPENSE'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Despesa
            </button>
          </div>

          {/* Contribution source toggle */}
          {txType === 'CONTRIBUTION' && (
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={source === 'member'}
                  onChange={() => {
                    setSource('member');
                    setDonorName('');
                  }}
                  className="accent-primary"
                />
                Membro
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={source === 'external'}
                  onChange={() => {
                    setSource('external');
                    setMemberId('');
                  }}
                  className="accent-primary"
                />
                Doação Externa
              </label>
            </div>
          )}

          {/* Member select */}
          {txType === 'CONTRIBUTION' && source === 'member' && (
            <div>
              <Label>Membro *</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Selecione um membro..." />
                </SelectTrigger>
                <SelectContent>
                  {activeMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Donor name */}
          {txType === 'CONTRIBUTION' && source === 'external' && (
            <div>
              <Label>Nome do Doador</Label>
              <Input
                className="mt-1"
                placeholder="Deixe em branco para anônimo"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
              />
            </div>
          )}

          {/* Vendor name (expense) */}
          {txType === 'EXPENSE' && (
            <div>
              <Label>Fornecedor</Label>
              <Input
                className="mt-1"
                placeholder="Nome do fornecedor (opcional)"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
              />
            </div>
          )}

          {/* Campaign select */}
          <div>
            <Label>Campanha</Label>
            <Select
              value={campaignId || '__none__'}
              onValueChange={(v) => setCampaignId(v === '__none__' ? '' : v)}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Nenhuma (caixa geral)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhuma (caixa geral)</SelectItem>
                {activeCampaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      {c.name}
                      <Badge variant="outline" className="text-xs ml-1">
                        {CAMPAIGN_TYPE_LABELS[c.type] ?? c.type}
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Inline warning: member not in campaign */}
          {memberNotInCampaign && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Este membro não está vinculado a esta campanha. O valor entrará no
              caixa geral.
            </div>
          )}

          {/* Category */}
          {txType === 'CONTRIBUTION' && (
            <div>
              <Label>Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {contributionCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div>
            <Label>Descrição *</Label>
            <Input
              className="mt-1"
              placeholder="Ex: Mensalidade março"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Amount */}
            <div>
              <Label>Valor (R$) *</Label>
              <Input
                className="mt-1"
                type="number"
                min={0.01}
                step={0.01}
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* Date */}
            <div>
              <Label>Data *</Label>
              <Input
                className="mt-1"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
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
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Salvando...' : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
