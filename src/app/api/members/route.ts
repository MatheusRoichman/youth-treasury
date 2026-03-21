import { NextResponse } from 'next/server';
import { getMembers } from '@/lib/db/members';

export async function GET() {
  const members = await getMembers();
  return NextResponse.json(
    members.map((m) => ({
      ...m,
      birthDate: m.birthDate?.toISOString().split('T')[0] ?? null,
      createdAt: m.createdAt.toISOString(),
    })),
  );
}
