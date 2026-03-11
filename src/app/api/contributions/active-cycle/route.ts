import { NextResponse } from "next/server";
import { getActiveCycleWithContributions } from "@/lib/db/contributions";

export async function GET() {
  const cycle = await getActiveCycleWithContributions();
  if (!cycle) return NextResponse.json(null);

  const serialized = {
    ...cycle,
    goalAmount: cycle.goalAmount.toString(),
    createdAt: cycle.createdAt.toISOString(),
    contributions: cycle.contributions.map((c) => ({
      ...c,
      amount: c.amount?.toString() ?? null,
      paidAt: c.paidAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
    })),
  };

  return NextResponse.json(serialized);
}
