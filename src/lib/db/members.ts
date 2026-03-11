import { prisma } from "@/lib/prisma";

export async function getMembers() {
  return prisma.member.findMany({ orderBy: { name: "asc" } });
}

export async function getActiveMembers() {
  return prisma.member.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });
}

export async function getMemberById(id: string) {
  return prisma.member.findUnique({ where: { id } });
}
