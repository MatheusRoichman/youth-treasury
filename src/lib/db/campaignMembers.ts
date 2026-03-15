import type { ExemptionCategory } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export async function addMemberToCampaign(
  campaignId: string,
  memberId: string,
  expectedAmount: number,
) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error('Campanha não encontrada');
  if (campaign.type !== 'FUNDRAISER') {
    throw new Error(
      'Apenas campanhas do tipo Arrecadação permitem adicionar membros manualmente',
    );
  }

  return prisma.campaignMember.create({
    data: { campaignId, memberId, expectedAmount },
  });
}

export async function setMemberExempt(
  campaignId: string,
  memberId: string,
  isExempt: boolean,
  exemptionData?: { reason: string; category: string } | null,
) {
  return prisma.campaignMember.update({
    where: { campaignId_memberId: { campaignId, memberId } },
    data: isExempt
      ? {
          isExempt: true,
          exemptionReason: exemptionData?.reason ?? null,
          exemptionCategory: (exemptionData?.category as ExemptionCategory) ?? null,
        }
      : {
          isExempt: false,
          exemptionReason: null,
          exemptionCategory: null,
        },
  });
}

export async function campaignMemberExists(
  campaignId: string,
  memberId: string,
): Promise<boolean> {
  const cm = await prisma.campaignMember.findUnique({
    where: { campaignId_memberId: { campaignId, memberId } },
    select: { id: true },
  });
  return cm !== null;
}

export async function getCampaignMembersWithDerivedStatus(campaignId: string) {
  const campaignMembers = await prisma.campaignMember.findMany({
    where: { campaignId },
    include: { member: true },
    orderBy: { member: { name: 'asc' } },
  });

  const memberIds = campaignMembers.map((cm) => cm.memberId);

  const transactions = await prisma.transaction.findMany({
    where: {
      campaignId,
      memberId: { in: memberIds },
      type: 'CONTRIBUTION',
    },
    select: { memberId: true, amount: true },
  });

  const paidByMember: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.memberId) {
      paidByMember[tx.memberId] = (paidByMember[tx.memberId] ?? 0) + Number(tx.amount);
    }
  }

  return campaignMembers.map((cm) => {
    const paidAmount = paidByMember[cm.memberId] ?? 0;
    const expectedAmount = Number(cm.expectedAmount);
    let status: 'EXEMPT' | 'PENDING' | 'PARTIAL' | 'PAID';
    if (cm.isExempt) {
      status = 'EXEMPT';
    } else if (paidAmount === 0) {
      status = 'PENDING';
    } else if (paidAmount < expectedAmount) {
      status = 'PARTIAL';
    } else {
      status = 'PAID';
    }
    return { ...cm, paidAmount, status };
  });
}
