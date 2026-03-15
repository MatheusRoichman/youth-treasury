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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addTransactionAction } from '@/lib/actions/transactions';
import { campaignKeys } from '@/lib/queries/campaigns';
import { formatCurrency } from '@/lib/utils';

interface Props {
  trigger: React.ReactNode;
  campaignId: string;
  campaignType: 'MONTHLY_FEE' | 'FUNDRAISER';
  member: { id: string; name: string };
  expectedAmount: number;
  paidAmount: number;
}

export function RegisterPaymentDialog({
  trigger,
  campaignId,
  campaignType,
  member,
  expectedAmount,
  paidAmount,
}: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const remaining = Math.max(0, expectedAmount - paidAmount);

  const [amount, setAmount] = useState(remaining);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  function resetForm() {
    setAmount(remaining);
    setDate(new Date().toISOString().slice(0, 10));
  }

  async function handleSubmit() {
    if (!amount || amount <= 0) {
      toast.error('Valor deve ser positivo');
      return;
    }

    setSubmitting(true);
    try {
      const res = await addTransactionAction({
        type: 'CONTRIBUTION',
        category: campaignType === 'MONTHLY_FEE' ? 'MONTHLY_FEE' : 'OFFERING',
        description:
          campaignType === 'MONTHLY_FEE' ? 'Mensalidade' : 'Contribuição',
        amount,
        date,
        memberId: member.id,
        campaignId,
      });

      if (res.success) {
        toast.success('Pagamento registrado!');
        queryClient.invalidateQueries({
          queryKey: campaignKeys.detail(campaignId),
        });
        setOpen(false);
        resetForm();
      } else {
        toast.error(res.error ?? 'Erro ao registrar pagamento');
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
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-gray-50 px-4 py-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Membro</span>
              <span className="font-medium text-gray-900">{member.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Valor Esperado</span>
              <span className="font-medium">{formatCurrency(expectedAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Já Pago</span>
              <span className="font-medium text-green-600">
                {formatCurrency(paidAmount)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold text-gray-700">Restante</span>
              <span className="font-bold text-orange-600">
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>

          <div>
            <Label>Valor a Pagar (R$) *</Label>
            <Input
              className="mt-1"
              type="number"
              min={0.01}
              step={0.01}
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>

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
            {submitting ? 'Salvando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
