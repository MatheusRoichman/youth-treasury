import { TransactionsTable } from '@/components/transactions/transactions-table';
import { getActiveCampaigns, getCampaigns } from '@/lib/db/campaigns';
import { getActiveMembers } from '@/lib/db/members';
import { getTransactions } from '@/lib/db/transactions';

export default async function TransactionsPage() {
  const [transactionsResult, activeMembers, activeCampaigns, allCampaigns] =
    await Promise.all([
      getTransactions({ limit: 20, page: 1 }),
      getActiveMembers(),
      getActiveCampaigns(),
      getCampaigns(),
    ]);

  const initialData = {
    transactions: transactionsResult.rows.map((tx) => ({
      id: tx.id,
      type: tx.type as 'CONTRIBUTION' | 'EXPENSE',
      category: tx.category,
      description: tx.description,
      amount: tx.amount.toString(),
      date: tx.date.toISOString(),
      createdAt: tx.createdAt.toISOString(),
      memberId: tx.memberId,
      donorName: tx.donorName,
      vendorName: tx.vendorName,
      campaignId: tx.campaignId,
      member: tx.member
        ? { id: tx.member.id, name: tx.member.name, initials: tx.member.initials }
        : null,
      campaign: tx.campaign
        ? { id: tx.campaign.id, name: tx.campaign.name, type: tx.campaign.type }
        : null,
    })),
    total: transactionsResult.total,
    page: transactionsResult.page,
    limit: transactionsResult.limit,
  };

  const serializedActiveMembers = activeMembers.map((m) => ({
    id: m.id,
    name: m.name,
    initials: m.initials,
  }));

  const serializedActiveCampaigns = activeCampaigns.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    memberIds: c.campaignMembers.map((cm) => cm.memberId),
  }));

  const serializedAllCampaigns = allCampaigns.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
  }));

  return (
    <div className="flex flex-col min-h-full">
      <main className="flex-1 p-6 bg-gray-50">
        <TransactionsTable
          initialData={initialData}
          activeMembers={serializedActiveMembers}
          activeCampaigns={serializedActiveCampaigns}
          allCampaigns={serializedAllCampaigns}
        />
      </main>
    </div>
  );
}
