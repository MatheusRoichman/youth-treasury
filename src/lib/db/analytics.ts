import { prisma } from '@/lib/prisma';

export async function getBalanceBreakdown() {
  const [contributions, expenses, campaignContributions, campaignExpenses] =
    await Promise.all([
      prisma.transaction.aggregate({
        where: { type: 'CONTRIBUTION' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: 'CONTRIBUTION', campaignId: { not: null } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: 'EXPENSE', campaignId: { not: null } },
        _sum: { amount: true },
      }),
    ]);

  const totalIn = Number(contributions._sum.amount ?? 0);
  const totalOut = Number(expenses._sum.amount ?? 0);
  const campaignIn = Number(campaignContributions._sum.amount ?? 0);
  const campaignOut = Number(campaignExpenses._sum.amount ?? 0);

  const totalBalance = totalIn - totalOut;
  const campaignBalance = campaignIn - campaignOut;
  const generalBalance = totalBalance - campaignBalance;

  return { totalBalance, campaignBalance, generalBalance };
}
