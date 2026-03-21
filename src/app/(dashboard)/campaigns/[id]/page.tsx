import { notFound } from 'next/navigation';
import { CampaignDetail } from '@/components/campaigns/campaign-detail';
import { getCampaignMembersWithDerivedStatus } from '@/lib/db/campaignMembers';
import { getCampaignById } from '@/lib/db/campaigns';
import { getActiveMembers } from '@/lib/db/members';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: Props) {
  const { id } = await params;

  const [campaign, membersWithStatus, activeMembers] = await Promise.all([
    getCampaignById(id),
    getCampaignMembersWithDerivedStatus(id),
    getActiveMembers(),
  ]);

  if (!campaign) notFound();

  const campaignMemberIds = new Set(membersWithStatus.map((cm) => cm.memberId));
  const availableMembers = activeMembers
    .filter((m) => !campaignMemberIds.has(m.id))
    .map((m) => ({ id: m.id, name: m.name, initials: m.initials }));

  const totalRaised = campaign.transactions
    .filter((tx) => tx.type === 'CONTRIBUTION')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const serialized = {
    id: campaign.id,
    name: campaign.name,
    type: campaign.type,
    goalAmount: campaign.goalAmount.toString(),
    startDate: campaign.startDate.toISOString().split('T')[0],
    endDate: campaign.endDate?.toISOString().split('T')[0] ?? null,
    status: campaign.status,
    createdAt: campaign.createdAt.toISOString(),
    totalRaised,
    campaignBalance: campaign.campaignBalance,
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
      date: tx.date.toISOString().split('T')[0],
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

  return (
    <div className="flex flex-col min-h-full">
      <main className="flex-1 p-6 bg-gray-50">
        <CampaignDetail
          initialData={serialized}
          availableMembers={availableMembers}
        />
      </main>
    </div>
  );
}
