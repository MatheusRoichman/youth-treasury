import { NextResponse } from 'next/server';
import { getRecentTransactions } from '@/lib/db/dashboard';

export async function GET() {
  const transactions = await getRecentTransactions(10);
  return NextResponse.json(transactions);
}
