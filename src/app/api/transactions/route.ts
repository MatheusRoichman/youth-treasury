import { NextResponse } from 'next/server';
import type {
  TransactionCategory,
  TransactionType,
} from '@/generated/prisma/client';
import { getTransactions } from '@/lib/db/transactions';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 20);
  const type = searchParams.get('type') as TransactionType | null;
  const category = searchParams.get('category') as TransactionCategory | null;
  const campaignId = searchParams.get('campaignId') ?? undefined;
  const dateStart = searchParams.get('dateStart');
  const dateEnd = searchParams.get('dateEnd');
  const search = searchParams.get('search') ?? undefined;

  const result = await getTransactions({
    page,
    limit,
    type: type ?? undefined,
    category: category ?? undefined,
    campaignId,
    dateStart: dateStart ? new Date(dateStart) : undefined,
    dateEnd: dateEnd ? new Date(dateEnd) : undefined,
    search,
  });

  const serialized = {
    transactions: result.rows.map((tx) => ({
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
      campaignId: tx.campaignId,
      member: tx.member
        ? {
            id: tx.member.id,
            name: tx.member.name,
            initials: tx.member.initials,
          }
        : null,
      campaign: tx.campaign
        ? { id: tx.campaign.id, name: tx.campaign.name, type: tx.campaign.type }
        : null,
    })),
    total: result.total,
    page: result.page,
    limit: result.limit,
  };

  return NextResponse.json(serialized);
}
