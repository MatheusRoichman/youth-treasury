import { NextResponse } from 'next/server';
import { getCampaigns } from '@/lib/db/campaigns';

export async function GET() {
  const campaigns = await getCampaigns();

  const serialized = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    goalAmount: c.goalAmount.toString(),
    startDate: c.startDate.toISOString(),
    endDate: c.endDate?.toISOString() ?? null,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    totalRaised: c.transactions.reduce((sum, tx) => sum + Number(tx.amount), 0),
  }));

  return NextResponse.json(serialized);
}
