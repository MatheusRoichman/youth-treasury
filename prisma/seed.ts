import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { Pool } from 'pg';
import {
  PrismaClient,
  TransactionCategory,
  TransactionType,
} from '../src/generated/prisma/client';

config({ path: path.join(process.cwd(), '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
// biome-ignore lint/suspicious/noExplicitAny: Prisma v7 adapter type
const prisma = new PrismaClient({ adapter } as any);

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const MEMBERS = [
  'Ana Carolina Silva',
  'Bruno Henrique Oliveira',
  'Carla Fernanda Santos',
  'Diego Augusto Lima',
  'Eduarda Cristina Pereira',
  'Felipe Rodrigues Alves',
  'Gabriela Moura Costa',
  'Henrique José Barbosa',
  'Isabela Nascimento Ferreira',
  'João Paulo Ribeiro',
  'Larissa Beatriz Carvalho',
  'Marcelo Andrade Souza',
  'Natália Gomes Martins',
  'Pedro Lucas Araújo',
  'Rafaela Cristina Mendes',
];

const monthNames = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.transaction.deleteMany();
  await prisma.campaignMember.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.member.deleteMany();
  await prisma.settings.deleteMany();

  await prisma.settings.create({
    data: {
      id: 'singleton',
      churchName: 'Igreja Renovação',
      departmentName: 'Departamento de Jovens',
    },
  });

  const members = await Promise.all(
    MEMBERS.map((name) =>
      prisma.member.create({
        data: {
          name,
          initials: deriveInitials(name),
          status: 'ACTIVE',
          phone: `(11) 9${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
          email: `${name.split(' ')[0].toLowerCase()}.${name.split(' ')[name.split(' ').length - 1].toLowerCase()}@email.com`,
        },
      }),
    ),
  );

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const dayInMonth = (d: number) => new Date(year, month - 1, d);

  // ── MONTHLY_FEE Campaign ──────────────────────────────────────
  const expectedPerMember = 20;
  const monthlyFeeGoal = expectedPerMember * members.length; // 20 * 15 = 300

  const monthlyCampaign = await prisma.campaign.create({
    data: {
      name: `Mensalidade ${monthNames[month - 1]} ${year}`,
      type: 'MONTHLY_FEE',
      goalAmount: monthlyFeeGoal,
      startDate: new Date(year, month - 1, 1),
      status: 'ACTIVE',
    },
  });

  // 2 members exempt (Diego idx=3, João idx=9)
  // 9 members paid fully, 1 partial, 3 pending
  const exemptIndices = new Set([3, 9]);

  await Promise.all(
    members.map((m, i) =>
      prisma.campaignMember.create({
        data: {
          campaignId: monthlyCampaign.id,
          memberId: m.id,
          expectedAmount: expectedPerMember,
          isExempt: exemptIndices.has(i),
        },
      }),
    ),
  );

  // 5 fully paid members (0-2, 4-5 excluding exempts 3,9)
  const paidMonthlyIndices = [0, 1, 2, 4, 5];
  // 1 partial (Marcelo idx=11, paid 10 of 20)
  const partialMonthlyIndices = [11];
  // Remaining (12=Natália, 13=Pedro, 14=Rafaela) stay PENDING

  for (const idx of paidMonthlyIndices) {
    await prisma.transaction.create({
      data: {
        type: TransactionType.CONTRIBUTION,
        category: TransactionCategory.MONTHLY_FEE,
        description: 'Mensalidade',
        memberId: members[idx].id,
        campaignId: monthlyCampaign.id,
        amount: expectedPerMember,
        date: dayInMonth(Math.floor(Math.random() * 15) + 1),
      },
    });
  }

  for (const idx of partialMonthlyIndices) {
    await prisma.transaction.create({
      data: {
        type: TransactionType.CONTRIBUTION,
        category: TransactionCategory.MONTHLY_FEE,
        description: 'Mensalidade (parcial)',
        memberId: members[idx].id,
        campaignId: monthlyCampaign.id,
        amount: 10,
        date: dayInMonth(Math.floor(Math.random() * 15) + 1),
      },
    });
  }

  // ── FUNDRAISER Campaign ───────────────────────────────────────
  const fundraiserGoal = 2000;
  const fundraiserMemberIndices = [0, 1, 2, 4, 5, 6, 7, 8];
  const expectedPerFundraiser = fundraiserGoal / fundraiserMemberIndices.length; // 250

  const fundraiserCampaign = await prisma.campaign.create({
    data: {
      name: 'Retiro Jovem 2024',
      type: 'FUNDRAISER',
      goalAmount: fundraiserGoal,
      startDate: new Date(year, month - 1, 1),
      status: 'ACTIVE',
    },
  });

  await Promise.all(
    fundraiserMemberIndices.map((idx) =>
      prisma.campaignMember.create({
        data: {
          campaignId: fundraiserCampaign.id,
          memberId: members[idx].id,
          expectedAmount: expectedPerFundraiser,
        },
      }),
    ),
  );

  // 3 members paid for fundraiser
  const paidFundraiserIndices = [0, 1, 2];
  for (const pos of paidFundraiserIndices) {
    const idx = fundraiserMemberIndices[pos];
    await prisma.transaction.create({
      data: {
        type: TransactionType.CONTRIBUTION,
        category: TransactionCategory.OFFERING,
        description: 'Retiro Jovem 2024',
        memberId: members[idx].id,
        campaignId: fundraiserCampaign.id,
        amount: expectedPerFundraiser,
        date: dayInMonth(Math.floor(Math.random() * 20) + 1),
      },
    });
  }

  // ── Expenses (unassigned to campaigns) ───────────────────────
  const expenses = [
    {
      description: 'Lanche do ensaio',
      amount: 85.5,
      date: dayInMonth(3),
      vendor: 'Padaria Central',
    },
    {
      description: 'Material de louvor',
      amount: 120,
      date: dayInMonth(7),
      vendor: 'Som e Louvor LTDA',
    },
    {
      description: 'Decoração da célula',
      amount: 45.9,
      date: dayInMonth(12),
      vendor: 'Papelaria Criativa',
    },
  ];

  for (const exp of expenses) {
    await prisma.transaction.create({
      data: {
        type: TransactionType.EXPENSE,
        category: TransactionCategory.EXPENSE,
        description: exp.description,
        vendorName: exp.vendor ?? undefined,
        amount: exp.amount,
        date: exp.date,
      },
    });
  }

  // ── Unassigned offering ───────────────────────────────────────
  await prisma.transaction.create({
    data: {
      type: TransactionType.CONTRIBUTION,
      category: TransactionCategory.OFFERING,
      description: 'Oferta do culto jovem',
      amount: 230,
      date: dayInMonth(5),
    },
  });

  const txCount =
    paidMonthlyIndices.length +
    partialMonthlyIndices.length +
    paidFundraiserIndices.length +
    expenses.length +
    1;

  console.log('✅ Seed completed!');
  console.log(`   ${members.length} membros`);
  console.log(
    `   2 campanhas: Mensalidade ${monthNames[month - 1]} ${year} + Retiro Jovem 2024`,
  );
  console.log(`   ${txCount} transações`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
