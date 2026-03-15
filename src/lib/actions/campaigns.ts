'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  createCampaign,
  getActiveMonthlyCampaign,
  updateCampaignStatus,
} from '@/lib/db/campaigns';

const createMonthlyFeeSchema = z.object({
  type: z.literal('MONTHLY_FEE'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  startDate: z.string().min(1, 'Data de início obrigatória'),
  endDate: z.string().optional(),
  expectedAmountPerMember: z.coerce
    .number()
    .positive('Valor por membro deve ser positivo'),
  memberIds: z.array(z.string()).min(1, 'Selecione ao menos um membro'),
});

const createFundraiserSchema = z.object({
  type: z.literal('FUNDRAISER'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  startDate: z.string().min(1, 'Data de início obrigatória'),
  endDate: z.string().optional(),
  goalAmount: z.coerce.number().positive('Meta deve ser positiva'),
  memberIds: z.array(z.string()),
});

const createCampaignSchema = z.discriminatedUnion('type', [
  createMonthlyFeeSchema,
  createFundraiserSchema,
]);

export async function createCampaignAction(formData: unknown) {
  const parsed = createCampaignSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    };
  }

  const data = parsed.data;

  try {
    if (data.type === 'MONTHLY_FEE') {
      const existing = await getActiveMonthlyCampaign();
      if (existing) {
        return {
          success: false,
          error: 'Já existe uma campanha de mensalidade ativa',
        };
      }

      const goalAmount = data.expectedAmountPerMember * data.memberIds.length;
      const campaign = await createCampaign({
        name: data.name,
        type: 'MONTHLY_FEE',
        goalAmount,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        memberIds: data.memberIds,
        expectedAmountPerMember: data.expectedAmountPerMember,
      });

      revalidatePath('/campaigns');
      revalidatePath('/');
      return { success: true, data: { id: campaign.id } };
    } else {
      const memberCount = data.memberIds.length;
      const expectedAmountPerMember =
        memberCount > 0 ? data.goalAmount / memberCount : 0;

      const campaign = await createCampaign({
        name: data.name,
        type: 'FUNDRAISER',
        goalAmount: data.goalAmount,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        memberIds: data.memberIds,
        expectedAmountPerMember,
      });

      revalidatePath('/campaigns');
      revalidatePath('/');
      return { success: true, data: { id: campaign.id } };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao criar campanha';
    return { success: false, error: msg };
  }
}

export async function updateCampaignStatusAction(
  id: string,
  status: 'CLOSED' | 'ARCHIVED',
) {
  const validStatuses = ['CLOSED', 'ARCHIVED'] as const;
  if (!validStatuses.includes(status)) {
    return { success: false, error: 'Status inválido' };
  }

  try {
    await updateCampaignStatus(id, status);
    revalidatePath('/campaigns');
    revalidatePath(`/campaigns/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: 'Erro ao atualizar status da campanha' };
  }
}
