'use client';

import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addMemberToCampaignAction } from '@/lib/actions/campaignMembers';
import { campaignKeys } from '@/lib/queries/campaigns';

interface AvailableMember {
  id: string;
  name: string;
  initials: string;
}

interface Props {
  campaignId: string;
  goalAmount: number;
  currentMemberCount: number;
  availableMembers: AvailableMember[];
}

export function AddMemberDialog({
  campaignId,
  goalAmount,
  currentMemberCount,
  availableMembers,
}: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [expectedAmount, setExpectedAmount] = useState(
    goalAmount / (currentMemberCount + 1),
  );

  function resetForm() {
    setSelectedMemberId('');
    setExpectedAmount(goalAmount / (currentMemberCount + 1));
  }

  async function handleSubmit() {
    if (!selectedMemberId) {
      toast.error('Selecione um membro');
      return;
    }
    if (!expectedAmount || expectedAmount <= 0) {
      toast.error('Valor esperado deve ser positivo');
      return;
    }

    setSubmitting(true);
    try {
      const res = await addMemberToCampaignAction(
        campaignId,
        selectedMemberId,
        expectedAmount,
      );

      if (res.success) {
        toast.success('Membro adicionado à campanha!');
        queryClient.invalidateQueries({
          queryKey: campaignKeys.detail(campaignId),
        });
        setOpen(false);
        resetForm();
      } else {
        toast.error(res.error ?? 'Erro ao adicionar membro');
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
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="h-4 w-4 mr-1.5" />
          Adicionar Membro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar Membro à Campanha</DialogTitle>
        </DialogHeader>

        {availableMembers.length === 0 ? (
          <p className="py-4 text-sm text-center text-gray-400">
            Todos os membros ativos já participam desta campanha.
          </p>
        ) : (
          <div className="space-y-4 py-2">
            <div>
              <Label>Membro *</Label>
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {availableMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Valor Esperado (R$) *</Label>
              <Input
                className="mt-1"
                type="number"
                min={0.01}
                step={0.01}
                value={expectedAmount || ''}
                onChange={(e) => setExpectedAmount(Number(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-400">
                Sugerido: meta ÷ total de membros após adição
              </p>
            </div>
          </div>
        )}

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
          {availableMembers.length > 0 && (
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Adicionando...' : 'Adicionar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
