'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addMemberToCampaign, setMemberExempt } from '@/lib/db/campaignMembers';

export async function addMemberToCampaignAction(
  campaignId: string,
  memberId: string,
  expectedAmount: number,
) {
  try {
    await addMemberToCampaign(campaignId, memberId, expectedAmount);
    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao adicionar membro';
    return { success: false, error: msg };
  }
}

const exemptTrueSchema = z.object({
  isExempt: z.literal(true),
  exemptionCategory: z.enum([
    'FINANCIAL_HARDSHIP',
    'HEALTH',
    'TRAVEL',
    'UNEMPLOYMENT',
    'OTHER',
  ]),
  exemptionReason: z
    .string()
    .min(10, 'Motivo deve ter pelo menos 10 caracteres')
    .max(300, 'Motivo deve ter no máximo 300 caracteres'),
});

const exemptFalseSchema = z.object({
  isExempt: z.literal(false),
});

const exemptSchema = z.discriminatedUnion('isExempt', [
  exemptTrueSchema,
  exemptFalseSchema,
]);

export async function setMemberExemptAction(
  campaignId: string,
  memberId: string,
  isExempt: boolean,
  data?: { exemptionCategory?: string; exemptionReason?: string },
) {
  const parsed = exemptSchema.safeParse({ isExempt, ...data });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    };
  }

  try {
    if (parsed.data.isExempt) {
      await setMemberExempt(campaignId, memberId, true, {
        reason: parsed.data.exemptionReason,
        category: parsed.data.exemptionCategory,
      });
    } else {
      await setMemberExempt(campaignId, memberId, false);
    }
    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true };
  } catch {
    return { success: false, error: 'Erro ao atualizar isenção' };
  }
}
