import "server-only";

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
}

function createPrismaClient(url: string) {
  const adapter = new PrismaMariaDb(url);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient(databaseUrl);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
