import { NextResponse } from 'next/server';
import { getRecentTransactions } from '@/lib/db/dashboard';

export async function GET() {
  const transactions = await getRecentTransactions(10);

  const serialized = transactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    description: tx.description,
    amount: tx.amount.toString(),
    date: tx.date.toISOString(),
    createdAt: tx.createdAt.toISOString(),
    member: tx.member
      ? { id: tx.member.id, name: tx.member.name, initials: tx.member.initials }
      : null,
    vendorName: tx.vendorName,
    campaign: tx.campaign ?? null,
  }));

  return NextResponse.json(serialized);
}
