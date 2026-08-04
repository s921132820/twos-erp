import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const querySchema = z.string().trim().min(1).max(100);

function dateOnly(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? null;
}

export async function GET(request: Request) {
  const query = querySchema.safeParse(new URL(request.url).searchParams.get("q") ?? "");
  if (!query.success) return NextResponse.json({ success: true, data: [] });

  const products = await prisma.product.findMany({
    where: { name: { contains: query.data } },
    take: 20,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      code: true,
      material: true,
      importLivestockHistories: {
        where: { isActive: true },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          historyNumber: true,
          countryOfOrigin: true,
          foreignSlaughterDate: true,
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: products.map(({ importLivestockHistories, ...product }) => ({
      ...product,
      activeHistories: importLivestockHistories.map((history) => ({
        ...history,
        foreignSlaughterDate: dateOnly(history.foreignSlaughterDate),
      })),
    })),
  });
}
