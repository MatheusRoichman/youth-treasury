import { prisma } from '@/lib/prisma';

export async function getSettings() {
  return prisma.settings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      churchName: 'Igreja Youth',
      departmentName: 'Departamento de Jovens',
      treasurerName: 'Tesoureiro',
      memberContributionAmount: 50,
    },
    update: {},
  });
}
