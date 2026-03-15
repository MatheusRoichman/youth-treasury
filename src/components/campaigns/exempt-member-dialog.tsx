'use client';

import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { setMemberExemptAction } from '@/lib/actions/campaignMembers';
import { campaignKeys } from '@/lib/queries/campaigns';

export const EXEMPTION_CATEGORY_LABELS: Record<string, string> = {
  FINANCIAL_HARDSHIP: 'Dificuldade financeira',
  HEALTH: 'Saúde',
  TRAVEL: 'Viagem',
  UNEMPLOYMENT: 'Desemprego',
  OTHER: 'Outro',
};

interface Props {
  trigger: React.ReactNode;
  campaignId: string;
  memberId: string;
  memberName: string;
}

export function ExemptMemberDialog({
  trigger,
  campaignId,
  memberId,
  memberName,
}: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState('');
  const [reason, setReason] = useState('');

  function resetForm() {
    setCategory('');
    setReason('');
  }

  async function handleSubmit() {
    if (!category) {
      toast.error('Selecione uma categoria');
      return;
    }
    if (reason.length < 10) {
      toast.error('O motivo deve ter pelo menos 10 caracteres');
      return;
    }
    if (reason.length > 300) {
      toast.error('O motivo deve ter no máximo 300 caracteres');
      return;
    }

    setSubmitting(true);
    try {
      const res = await setMemberExemptAction(campaignId, memberId, true, {
        exemptionCategory: category,
        exemptionReason: reason,
      });

      if (res.success) {
        toast.success('Isenção registrada!');
        queryClient.invalidateQueries({
          queryKey: campaignKeys.detail(campaignId),
        });
        setOpen(false);
        resetForm();
      } else {
        toast.error(res.error ?? 'Erro ao registrar isenção');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar Isenção</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <span className="text-gray-500">Membro: </span>
            <span className="font-medium text-gray-900">{memberName}</span>
          </div>

          <div>
            <Label>Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EXEMPTION_CATEGORY_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Motivo *</Label>
            <Textarea
              className="mt-1"
              placeholder="Descreva o motivo da isenção..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
            <p className="mt-1 text-xs text-gray-400">
              {reason.length}/300 caracteres (mínimo 10)
            </p>
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
            {submitting ? 'Salvando...' : 'Confirmar Isenção'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
