import { NextResponse } from 'next/server';
import { getCampaignMembersWithDerivedStatus } from '@/lib/db/campaignMembers';
import { getCampaignById } from '@/lib/db/campaigns';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const campaign = await getCampaignById(id);
  if (!campaign) return NextResponse.json(null, { status: 404 });

  const membersWithStatus = await getCampaignMembersWithDerivedStatus(id);

  const totalRaised = campaign.transactions
    .filter((tx) => tx.type === 'CONTRIBUTION')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const serialized = {
    id: campaign.id,
    name: campaign.name,
    type: campaign.type,
    goalAmount: campaign.goalAmount.toString(),
    startDate: campaign.startDate.toISOString(),
    endDate: campaign.endDate?.toISOString() ?? null,
    status: campaign.status,
    createdAt: campaign.createdAt.toISOString(),
    totalRaised,
    campaignMembers: membersWithStatus.map((cm) => ({
      id: cm.id,
      memberId: cm.memberId,
      campaignId: cm.campaignId,
      expectedAmount: cm.expectedAmount.toString(),
      isExempt: cm.isExempt,
      exemptionReason: cm.exemptionReason,
      exemptionCategory: cm.exemptionCategory,
      notes: cm.notes,
      createdAt: cm.createdAt.toISOString(),
      member: {
        id: cm.member.id,
        name: cm.member.name,
        initials: cm.member.initials,
      },
      paidAmount: cm.paidAmount,
      status: cm.status,
    })),
    transactions: campaign.transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      category: tx.category,
      description: tx.description,
      amount: tx.amount.toString(),
      date: tx.date.toISOString(),
      createdAt: tx.createdAt.toISOString(),
      memberId: tx.memberId,
      donorName: tx.donorName,
      vendorName: tx.vendorName,
      member: tx.member
        ? {
            id: tx.member.id,
            name: tx.member.name,
            initials: tx.member.initials,
          }
        : null,
    })),
  };

  return NextResponse.json(serialized);
}
