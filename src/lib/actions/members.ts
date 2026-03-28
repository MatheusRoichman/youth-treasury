'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const memberSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  birthDate: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val) return true;
      const [yearStr, monthStr, dayStr] = val.split('-');
      const year = Number(yearStr);
      const month = Number(monthStr);
      const day = Number(dayStr);
      // 1900 is the sentinel for "no year" and is not a leap year — use 2000 for the overflow check
      const checkYear = year === 1900 ? 2000 : year;
      const date = new Date(checkYear, month - 1, day);
      return (
        date.getFullYear() === checkYear &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      );
    }, 'Data de nascimento inválida'),
});

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function createMember(formData: unknown) {
  const parsed = memberSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    };
  }

  try {
    const member = await prisma.member.create({
      data: {
        name: parsed.data.name,
        initials: deriveInitials(parsed.data.name),
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        birthDate: parsed.data.birthDate
          ? new Date(parsed.data.birthDate)
          : null,
        status: 'ACTIVE',
      },
    });
    revalidatePath('/members');
    return { success: true, data: member };
  } catch {
    return { success: false, error: 'Erro ao criar membro' };
  }
}

export async function updateMember(id: string, formData: unknown) {
  const parsed = memberSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    };
  }

  try {
    const member = await prisma.member.update({
      where: { id },
      data: {
        name: parsed.data.name,
        initials: deriveInitials(parsed.data.name),
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        birthDate: parsed.data.birthDate
          ? new Date(parsed.data.birthDate)
          : null,
      },
    });
    revalidatePath('/members');
    return { success: true, data: member };
  } catch {
    return { success: false, error: 'Erro ao atualizar membro' };
  }
}

export async function deactivateMember(id: string) {
  try {
    await prisma.member.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
    revalidatePath('/members');
    return { success: true };
  } catch {
    return { success: false, error: 'Erro ao desativar membro' };
  }
}

export async function reactivateMember(id: string) {
  try {
    await prisma.member.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
    revalidatePath('/members');
    return { success: true };
  } catch {
    return { success: false, error: 'Erro ao reativar membro' };
  }
}
