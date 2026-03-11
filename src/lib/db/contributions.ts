import { prisma } from "@/lib/prisma";

export async function getActiveCycleWithContributions() {
  return prisma.monthlyCycle.findFirst({
    where: { isActive: true },
    include: {
      contributions: {
        include: { member: true },
        orderBy: { member: { name: "asc" } },
      },
    },
  });
}

export async function getCycleSummary(cycleId: string) {
  const contributions = await prisma.contribution.groupBy({
    by: ["status"],
    where: { cycleId },
    _count: true,
    _sum: { amount: true },
  });

  const paid = contributions.find((c) => c.status === "PAID");
  return {
    totalPaid: Number(paid?._sum.amount ?? 0),
    countPaid: paid?._count ?? 0,
  };
}
