import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const PRODUCT_PAGE_SIZES = [10, 50, 100] as const;
export type ProductPageSize = typeof PRODUCT_PAGE_SIZES[number];
export const PRODUCT_SEARCH_TYPES = ["productName", "manufacturingNo", "historyNo"] as const;
export type ProductSearchType = typeof PRODUCT_SEARCH_TYPES[number];
export type ProductFilters = { keyword?: string; searchType?: string; category?: string; page?: number; size?: number };

export function normalizeProductSearchType(value: string | undefined): ProductSearchType {
  return PRODUCT_SEARCH_TYPES.includes(value as ProductSearchType) ? value as ProductSearchType : "productName";
}

export function buildProductSearchWhere(searchType: ProductSearchType, keyword: string | undefined): Prisma.ProductWhereInput {
  const value = keyword?.trim();
  // 선택 검색값이 없으면 relation 조건을 포함하지 않아 전체 제품을 조회합니다.
  if (!value) return {};
  if (searchType === "manufacturingNo") return { code: { contains: value } };
  if (searchType === "historyNo") return { importLivestockHistories: { some: { historyNumber: { contains: value } } } };
  return { name: { contains: value } };
}

export function normalizeProductPageSize(value: number | string | undefined): ProductPageSize {
  const parsed = Number(value);
  return PRODUCT_PAGE_SIZES.includes(parsed as ProductPageSize) ? parsed as ProductPageSize : 10;
}

export async function getProducts(filters: ProductFilters) {
  const searchType = normalizeProductSearchType(filters.searchType);
  const keyword = filters.keyword?.trim() || undefined;
  const size = normalizeProductPageSize(filters.size);
  const requestedPage = Math.max(1, Math.floor(Number(filters.page) || 1));
  const where: Prisma.ProductWhereInput = {
    ...buildProductSearchWhere(searchType, keyword),
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
  return { products, totalCount, page, size, totalPages, searchType };
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
