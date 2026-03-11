import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { Pool } from "pg";
import {
  type ContributionStatus,
  PrismaClient,
  TransactionCategory,
  TransactionType,
} from "../src/generated/prisma/client";

config({ path: path.join(process.cwd(), ".env") });

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
  "Ana Carolina Silva",
  "Bruno Henrique Oliveira",
  "Carla Fernanda Santos",
  "Diego Augusto Lima",
  "Eduarda Cristina Pereira",
  "Felipe Rodrigues Alves",
  "Gabriela Moura Costa",
  "Henrique José Barbosa",
  "Isabela Nascimento Ferreira",
  "João Paulo Ribeiro",
  "Larissa Beatriz Carvalho",
  "Marcelo Andrade Souza",
  "Natália Gomes Martins",
  "Pedro Lucas Araújo",
  "Rafaela Cristina Mendes",
];

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.transaction.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.monthlyCycle.deleteMany();
  await prisma.member.deleteMany();
  await prisma.settings.deleteMany();

  await prisma.settings.create({
    data: {
      id: "singleton",
      churchName: "Igreja Renovação",
      departmentName: "Departamento de Jovens",
      treasurerName: "Carlos Eduardo",
      memberContributionAmount: 50,
    },
  });

  const members = await Promise.all(
    MEMBERS.map((name) =>
      prisma.member.create({
        data: {
          name,
          initials: deriveInitials(name),
          status: "ACTIVE",
          phone: `(11) 9${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
          email: `${name.split(" ")[0].toLowerCase()}.${name.split(" ")[name.split(" ").length - 1].toLowerCase()}@email.com`,
        },
      }),
    ),
  );

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const activeCycle = await prisma.monthlyCycle.create({
    data: {
      month,
      year,
      label: `${monthNames[month - 1]} ${year}`,
      goalAmount: 750,
      isActive: true,
    },
  });

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevCycle = await prisma.monthlyCycle.create({
    data: {
      month: prevMonth,
      year: prevYear,
      label: `${monthNames[prevMonth - 1]} ${prevYear}`,
      goalAmount: 750,
      isActive: false,
    },
  });

  const contributionStatuses: ContributionStatus[] = [
    "PAID",
    "PAID",
    "PAID",
    "PAID",
    "PAID",
    "PAID",
    "PAID",
    "PAID",
    "PAID",
    "PENDING",
    "PENDING",
    "PENDING",
    "PENDING",
    "EXEMPT",
    "EXEMPT",
  ];

  for (let i = 0; i < members.length; i++) {
    const status = contributionStatuses[i];
    await prisma.contribution.create({
      data: {
        memberId: members[i].id,
        cycleId: activeCycle.id,
        status,
        amount: status === "PAID" ? 50 : null,
        paidAt:
          status === "PAID"
            ? new Date(year, month - 1, Math.floor(Math.random() * 15) + 1)
            : null,
      },
    });
  }

  for (const member of members) {
    await prisma.contribution.create({
      data: {
        memberId: member.id,
        cycleId: prevCycle.id,
        status: "PAID",
        amount: 50,
        paidAt: new Date(
          prevYear,
          prevMonth - 1,
          Math.floor(Math.random() * 20) + 1,
        ),
      },
    });
  }

  const dayInMonth = (d: number) => new Date(year, month - 1, d);
  const paidMembers = members.slice(0, 9);

  for (const member of paidMembers) {
    await prisma.transaction.create({
      data: {
        type: TransactionType.CONTRIBUTION,
        category: TransactionCategory.MONTHLY_FEE,
        description: "Mensalidade",
        memberId: member.id,
        cycleId: activeCycle.id,
        amount: 50,
        date: dayInMonth(Math.floor(Math.random() * 15) + 1),
      },
    });
  }

  const expenses = [
    {
      description: "Lanche do ensaio",
      amount: 85.5,
      date: dayInMonth(3),
      vendor: "Padaria Central",
    },
    {
      description: "Material de louvor",
      amount: 120,
      date: dayInMonth(7),
      vendor: "Som e Louvor LTDA",
    },
    {
      description: "Decoração da célula",
      amount: 45.9,
      date: dayInMonth(12),
      vendor: "Papelaria Criativa",
    },
    {
      description: "Passagem de ônibus",
      amount: 38,
      date: dayInMonth(15),
      vendor: null,
    },
    {
      description: "Impressão de partituras",
      amount: 22.5,
      date: dayInMonth(18),
      vendor: "Copy Center",
    },
  ];

  for (const exp of expenses) {
    await prisma.transaction.create({
      data: {
        type: TransactionType.EXPENSE,
        category: TransactionCategory.EXPENSE,
        description: exp.description,
        vendorName: exp.vendor ?? undefined,
        cycleId: activeCycle.id,
        amount: exp.amount,
        date: exp.date,
      },
    });
  }

  await prisma.transaction.create({
    data: {
      type: TransactionType.CONTRIBUTION,
      category: TransactionCategory.OFFERING,
      description: "Oferta do culto jovem",
      cycleId: activeCycle.id,
      amount: 230,
      date: dayInMonth(5),
    },
  });

  console.log("✅ Seed completed!");
  console.log(`   ${members.length} membros`);
  console.log(
    `   2 ciclos (ativo: ${activeCycle.label}, anterior: ${prevCycle.label})`,
  );
  console.log(`   ${members.length * 2} contribuições`);
  console.log(`   ${paidMembers.length + expenses.length + 1} transações`);
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
