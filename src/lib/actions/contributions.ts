"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSettings } from "@/lib/db/settings";
import { prisma } from "@/lib/prisma";

export async function markContributionAsPaid(contributionId: string) {
  try {
    await prisma.contribution.update({
      where: { id: contributionId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        amount: (await getSettings()).memberContributionAmount,
      },
    });

    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
      include: { member: true, cycle: true },
    });

    if (contribution) {
      await prisma.transaction.create({
        data: {
          type: "CONTRIBUTION",
          category: "MONTHLY_FEE",
          description: "Mensalidade",
          memberId: contribution.memberId,
          cycleId: contribution.cycleId,
          amount:
            contribution.amount ??
            (await getSettings()).memberContributionAmount,
          date: new Date(),
        },
      });
    }

    revalidatePath("/contributions");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao registrar pagamento" };
  }
}

export async function exemptContribution(contributionId: string) {
  try {
    await prisma.contribution.update({
      where: { id: contributionId },
      data: { status: "EXEMPT", paidAt: null, amount: null },
    });
    revalidatePath("/contributions");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao isentar contribuição" };
  }
}

const openMonthSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2100),
  goalAmount: z.coerce.number().positive("Meta deve ser positiva"),
});

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

export async function openNewMonth(formData: unknown) {
  const parsed = openMonthSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const { month, year, goalAmount } = parsed.data;

  try {
    // Deactivate all existing active cycles
    await prisma.monthlyCycle.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new cycle
    const cycle = await prisma.monthlyCycle.create({
      data: {
        month,
        year,
        label: `${monthNames[month - 1]} ${year}`,
        goalAmount,
        isActive: true,
      },
    });

    // Create PENDING contributions for all active members
    const activeMembers = await prisma.member.findMany({
      where: { status: "ACTIVE" },
    });

    await prisma.contribution.createMany({
      data: activeMembers.map((m) => ({
        memberId: m.id,
        cycleId: cycle.id,
        status: "PENDING" as const,
      })),
    });

    revalidatePath("/contributions");
    revalidatePath("/");
    return { success: true, data: cycle };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique constraint")) {
      return { success: false, error: "Já existe um ciclo para este mês/ano" };
    }
    return { success: false, error: "Erro ao abrir novo mês" };
  }
}
