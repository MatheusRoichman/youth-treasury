import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function getPool(): Pool {
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return globalForPrisma.pool;
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg(getPool());
    // biome-ignore lint/suspicious/noExplicitAny: Prisma v7 adapter type
    globalForPrisma.prisma = new PrismaClient({ adapter } as any);
  }
  return globalForPrisma.prisma;
}

export const prisma = getPrisma();
