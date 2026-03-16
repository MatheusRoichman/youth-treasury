import { prisma } from '@/lib/prisma';

export async function getCurrentBalance() {
  const [contributions, expenses] = await Promise.all([
    prisma.transaction.aggregate({
      where: { type: 'CONTRIBUTION' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: 'EXPENSE' },
      _sum: { amount: true },
    }),
  ]);

  const totalIn = Number(contributions._sum.amount ?? 0);
  const totalOut = Number(expenses._sum.amount ?? 0);
  return totalIn - totalOut;
}

export async function getMonthSummary(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const [inAmount, outAmount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { date: { gte: start, lt: end }, type: 'CONTRIBUTION' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { date: { gte: start, lt: end }, type: 'EXPENSE' },
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
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: limit,
    include: { member: true, campaign: { select: { id: true, name: true } } },
  });
}
