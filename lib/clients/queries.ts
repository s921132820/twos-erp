import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const CLIENT_PAGE_LIMITS = [10, 50, 100] as const;
export type ClientPageLimit = typeof CLIENT_PAGE_LIMITS[number];
export type ClientFilters = { search?: string; page?: number; limit?: number };

export function normalizeClientLimit(value: number | string | undefined): ClientPageLimit {
  const parsed = Number(value);
  return CLIENT_PAGE_LIMITS.includes(parsed as ClientPageLimit) ? parsed as ClientPageLimit : 10;
}

export async function getClients(filters: ClientFilters = {}) {
  const search = filters.search?.trim();
  const limit = normalizeClientLimit(filters.limit);
  const requestedPage = Math.max(1, Math.floor(Number(filters.page) || 1));
  const where: Prisma.ClientWhereInput = search
    ? {
        OR: [
          { companyName: { contains: search } },
          { mobilePhone: { contains: search } },
        ],
      }
    : {};

  const total = await prisma.client.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(requestedPage, totalPages);
  const clients = await prisma.client.findMany({
    where, skip: (page - 1) * limit, take: limit,
    orderBy: [{ companyName: "asc" }, { id: "asc" }],
  });
  return { clients, total, page, totalPages, limit };
}

export async function getClient(clientId: string) {
  return prisma.client.findUnique({ where: { id: clientId } });
}
