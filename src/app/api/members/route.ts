import { NextResponse } from 'next/server';
import { getMembers } from '@/lib/db/members';

export async function GET() {
  const members = await getMembers();
  return NextResponse.json(
    members.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
  );
}
