import type { CampaignStatus, CampaignType } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export async function getCampaigns() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      transactions: {
        where: { type: 'CONTRIBUTION' },
        select: { amount: true },
      },
    },
  });
  return campaigns;
}

export async function getActiveCampaigns() {
  return prisma.campaign.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      campaignMembers: { select: { memberId: true } },
    },
  });
}

export async function getCampaignById(id: string) {
  return prisma.campaign.findUnique({
    where: { id },
    include: {
      campaignMembers: {
        include: { member: true },
        orderBy: { member: { name: 'asc' } },
      },
      transactions: {
        orderBy: { date: 'desc' },
        include: { member: true },
      },
    },
  });
}

export async function getActiveMonthlyCampaign() {
  return prisma.campaign.findFirst({
    where: { type: 'MONTHLY_FEE', status: 'ACTIVE' },
  });
}

interface CreateCampaignData {
  name: string;
  type: CampaignType;
  goalAmount: number;
  startDate: Date;
  endDate?: Date;
  memberIds: string[];
  expectedAmountPerMember: number;
}

export async function createCampaign(data: CreateCampaignData) {
  return prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.create({
      data: {
        name: data.name,
        type: data.type,
        goalAmount: data.goalAmount,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'ACTIVE',
      },
    });

    if (data.memberIds.length > 0) {
      await tx.campaignMember.createMany({
        data: data.memberIds.map((memberId) => ({
          campaignId: campaign.id,
          memberId,
          expectedAmount: data.expectedAmountPerMember,
        })),
      });
    }

    return campaign;
  });
}

export async function updateCampaignStatus(id: string, status: CampaignStatus) {
  return prisma.campaign.update({
    where: { id },
    data: { status },
  });
}
