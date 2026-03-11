'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const memberSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
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
