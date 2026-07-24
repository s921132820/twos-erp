import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const PRODUCT_PAGE_SIZES = [10, 50, 100] as const;
export type ProductPageSize = typeof PRODUCT_PAGE_SIZES[number];
export type ProductFilters = { query?: string; category?: string; page?: number; size?: number };

export function normalizeProductPageSize(value: number | string | undefined): ProductPageSize {
  const parsed = Number(value);
  return PRODUCT_PAGE_SIZES.includes(parsed as ProductPageSize) ? parsed as ProductPageSize : 10;
}

export async function getProducts(filters: ProductFilters) {
  const query = filters.query?.trim();
  const size = normalizeProductPageSize(filters.size);
  const requestedPage = Math.max(1, Math.floor(Number(filters.page) || 1));
  const where: Prisma.ProductWhereInput = {
    ...(query
      ? { OR: [{ id: { contains: query } }, { code: { contains: query } }, { name: { contains: query } }] }
      : {}),
    ...(filters.category ? { category: filters.category } : {}),
  };

  const totalCount = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / size));
  const page = Math.min(requestedPage, totalPages);
  const products = await prisma.product.findMany({
    where,
    skip: (page - 1) * size,
    take: size,
    include: { importLivestockHistories: { orderBy: [{ importDate: "desc" }, { id: "desc" }] } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return { products, totalCount, page, size, totalPages };
}

export async function getProductCategories() {
  const rows = await prisma.product.findMany({ distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } });
  return rows.map((row) => row.category);
}

export async function getProductWithImportHistories(productId: string) {
  return prisma.product.findUnique({
    where: { id: productId },
    include: {
      importLivestockHistories: {
        orderBy: [{ importDate: "desc" }, { id: "desc" }],
      },
    },
  });
}
