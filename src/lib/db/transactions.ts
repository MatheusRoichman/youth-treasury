import type {
  TransactionCategory,
  TransactionType,
} from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

interface CreateTransactionData {
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amount: number;
  date: Date;
  memberId?: string;
  donorName?: string;
  vendorName?: string;
  campaignId?: string;
}

export async function createTransaction(data: CreateTransactionData) {
  if (data.memberId && data.campaignId) {
    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        campaignId_memberId: {
          campaignId: data.campaignId,
          memberId: data.memberId,
        },
      },
    });
    if (!campaignMember) {
      throw new Error('Membro não está associado a esta campanha');
    }
  }

  return prisma.transaction.create({ data });
}

export async function getTransactions(options?: {
  campaignId?: string;
  type?: TransactionType;
  category?: TransactionCategory;
  dateStart?: Date;
  dateEnd?: Date;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const limit = options?.limit ?? 20;
  const page = options?.page ?? 1;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (options?.campaignId) where.campaignId = options.campaignId;
  if (options?.type) where.type = options.type;
  if (options?.category) where.category = options.category;
  if (options?.dateStart || options?.dateEnd) {
    where.date = {
      ...(options.dateStart ? { gte: options.dateStart } : {}),
      ...(options.dateEnd ? { lte: options.dateEnd } : {}),
    };
  }
  if (options?.search) {
    where.OR = [
      { member: { name: { contains: options.search, mode: 'insensitive' } } },
      { donorName: { contains: options.search, mode: 'insensitive' } },
      { vendorName: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
      include: {
        member: { select: { id: true, name: true, initials: true } },
        campaign: { select: { id: true, name: true, type: true } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return { rows, total, page, limit };
}
