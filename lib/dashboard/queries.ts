import "server-only";

import { prisma } from "@/lib/prisma";

export async function getDashboardSummary() {
  const [productCount, categoryRows, recentProducts] = await Promise.all([
    prisma.product.count(),
    prisma.product.findMany({
      distinct: ["category"],
      select: { category: true },
    }),
    prisma.product.findMany({
      take: 5,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        unit: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    productCount,
    categoryCount: categoryRows.length,
    recentProducts,
  };
}
