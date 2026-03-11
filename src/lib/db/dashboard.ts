import { prisma } from "@/lib/prisma";

export async function getCurrentBalance() {
  const [contributions, expenses] = await Promise.all([
    prisma.transaction.aggregate({
      where: { type: "CONTRIBUTION" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "EXPENSE" },
      _sum: { amount: true },
    }),
  ]);

  const totalIn = Number(contributions._sum.amount ?? 0);
  const totalOut = Number(expenses._sum.amount ?? 0);
  return totalIn - totalOut;
}

export async function getMonthlySummary(cycleId: string) {
  const [inAmount, outAmount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { cycleId, type: "CONTRIBUTION" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { cycleId, type: "EXPENSE" },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalIn: Number(inAmount._sum.amount ?? 0),
    totalOut: Number(outAmount._sum.amount ?? 0),
  };
}

export async function getRecentTransactions(limit = 10) {
  return prisma.transaction.findMany({
    orderBy: { date: "desc" },
    take: limit,
    include: { member: true },
  });
}

export async function getActiveCycle() {
  return prisma.monthlyCycle.findFirst({ where: { isActive: true } });
}

export async function getPreviousCycle(currentMonth: number, currentYear: number) {
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  return prisma.monthlyCycle.findUnique({
    where: { month_year: { month: prevMonth, year: prevYear } },
  });
}
