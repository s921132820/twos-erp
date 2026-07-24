import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ClientFilters = { query?: string };

export async function getClients(filters: ClientFilters = {}) {
  const query = filters.query?.trim();
  const where: Prisma.ClientWhereInput = query
    ? {
        OR: [
          { companyName: { contains: query } },
          { mobilePhone: { contains: query } },
        ],
      }
    : {};

  return prisma.client.findMany({
    where,
    orderBy: [{ companyName: "asc" }, { id: "asc" }],
  });
}

export async function getClient(clientId: string) {
  return prisma.client.findUnique({ where: { id: clientId } });
}
