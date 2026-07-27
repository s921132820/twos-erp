import "server-only";

import { prisma } from "@/lib/prisma";

export async function getDashboardSummary() {
  // 순차 실행하여 DB 장애 시 여러 쿼리가 동시에 연결 풀을 기다리지 않게 한다.
  const productCount = await prisma.product.count();
  const categoryRows = await prisma.product.findMany({
    distinct: ["category"],
    select: { category: true },
  });
  const recentProducts = await prisma.product.findMany({
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
  });

  return {
    productCount,
    categoryCount: categoryRows.length,
    recentProducts,
  };
}
