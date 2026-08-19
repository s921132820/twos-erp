import "server-only";

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
}

function createPrismaClient(url: string) {
  const parsedUrl = new URL(url);
  const database = decodeURIComponent(parsedUrl.pathname.replace(/^\//, ""));

  if (!parsedUrl.username || !database) {
    throw new Error("DATABASE_URL에 사용자명과 데이터베이스명이 필요합니다.");
  }

  const host = parsedUrl.hostname === "localhost" ? "127.0.0.1" : parsedUrl.hostname;
  const port = parsedUrl.port ? Number(parsedUrl.port) : 3306;

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("DATABASE_URL의 포트가 올바르지 않습니다.");
  }

  if (process.env.NODE_ENV === "development") {
    console.info(`[Prisma] host=${host} port=${port} database=${database}`);
  }

  const adapter = new PrismaMariaDb({
    host,
    port,
    user: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    database,
    connectionLimit: 10,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient(databaseUrl);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
