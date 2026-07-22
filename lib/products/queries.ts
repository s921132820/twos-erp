import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ProductFilters = { query?: string; category?: string; active?: string };

export async function getProducts(filters: ProductFilters) {
  const query = filters.query?.trim();
  const where: Prisma.ProductWhereInput = {
    ...(query
      ? { OR: [{ code: { contains: query } }, { name: { contains: query } }] }
      : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.active === "true" || filters.active === "false"
      ? { isActive: filters.active === "true" }
      : {}),
  };

  return prisma.product.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
}

export async function getProductCategories() {
  const rows = await prisma.product.findMany({ distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } });
  return rows.map((row) => row.category);
}
