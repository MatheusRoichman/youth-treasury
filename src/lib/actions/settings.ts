"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  churchName: z.string().min(2, "Nome da igreja deve ter pelo menos 2 caracteres"),
  departmentName: z.string().min(2, "Nome do departamento deve ter pelo menos 2 caracteres"),
  treasurerName: z.string().min(2, "Nome do tesoureiro deve ter pelo menos 2 caracteres"),
  memberContributionAmount: z.number().min(0, "Valor deve ser maior ou igual a zero"),
});

export async function updateSettings(formData: unknown) {
  const parsed = settingsSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await prisma.settings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", ...parsed.data },
      update: parsed.data,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao salvar configurações" };
  }
}
