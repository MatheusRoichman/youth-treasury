'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { campaignMemberExists } from '@/lib/db/campaignMembers';
import { createTransaction } from '@/lib/db/transactions';

const addTransactionSchema = z.object({
  type: z.enum(['CONTRIBUTION', 'EXPENSE']),
  category: z.enum(['MONTHLY_FEE', 'OFFERING', 'EXPENSE', 'OTHER']),
  description: z.string().min(1, 'Descrição obrigatória'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data obrigatória'),
  memberId: z.string().optional(),
  donorName: z.string().optional(),
  vendorName: z.string().optional(),
  campaignId: z.string().optional(),
});

export async function addTransactionAction(formData: unknown) {
  const parsed = addTransactionSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    };
  }

  const { date, ...rest } = parsed.data;

  try {
    await createTransaction({
      ...rest,
      date: new Date(date),
    });
    revalidatePath('/campaigns');
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao registrar transação';
    return { success: false, error: msg };
  }
}

const createTransactionSchema = z
  .object({
    type: z.enum(['CONTRIBUTION', 'EXPENSE']),
    category: z.enum(['MONTHLY_FEE', 'OFFERING', 'EXPENSE', 'OTHER']),
    description: z.string().min(1, 'Descrição obrigatória'),
    amount: z.coerce
      .number()
      .positive('Valor deve ser positivo')
      .refine(
        (v) => v === Math.round(v * 100) / 100,
        'Valor pode ter no máximo 2 casas decimais',
      ),
    date: z.coerce.date().max(new Date(), {
      message: 'A data não pode ser no futuro',
    }),
    memberId: z.string().optional().or(z.literal('')),
    donorName: z.string().optional().or(z.literal('')),
    vendorName: z.string().optional().or(z.literal('')),
    campaignId: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'EXPENSE') {
      if (data.memberId) {
        ctx.addIssue({
          code: 'custom',
          path: ['memberId'],
          message: 'Despesas não devem ter membro associado',
        });
      }
      if (data.donorName) {
        ctx.addIssue({
          code: 'custom',
          path: ['donorName'],
          message: 'Despesas não devem ter doador associado',
        });
      }
    }
  });

export async function createTransactionAction(formData: unknown) {
  const parsed = createTransactionSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    };
  }

  const { date, ...fields } = parsed.data;

  // Normalise empty strings to undefined
  let memberId = fields.memberId || undefined;
  const donorName = fields.donorName || undefined;
  const vendorName = fields.vendorName || undefined;
  let campaignId = fields.campaignId || undefined;

  // If CONTRIBUTION + member + campaign: silently drop campaign if member not enrolled
  if (fields.type === 'CONTRIBUTION' && memberId && campaignId) {
    const linked = await campaignMemberExists(campaignId, memberId);
    if (!linked) campaignId = undefined;
  }

  // If EXPENSE: clear member and donor
  if (fields.type === 'EXPENSE') {
    memberId = undefined;
  }

  try {
    await createTransaction({
      type: fields.type,
      category: fields.category,
      description: fields.description,
      amount: fields.amount,
      date: new Date(date),
      memberId,
      donorName,
      vendorName,
      campaignId,
    });
    revalidatePath('/transactions');
    revalidatePath('/campaigns');
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao registrar transação';
    return { success: false, error: msg };
  }
}
