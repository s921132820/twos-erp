import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { lookupAnimalTrace } from "@/lib/public-api/animal-trace";
import { supportsAnimalTraceLookup } from "@/lib/products/is-goat-product";

const requestSchema = z.object({
  historyNumber: z.string().trim().min(8, "이력번호를 정확히 입력해 주세요.").max(50, "이력번호가 너무 깁니다.").regex(/^[A-Za-z0-9]+$/, "이력번호는 영문과 숫자만 입력할 수 있습니다."),
});

export async function POST(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true, category: true, unit: true } });
  if (!product) return NextResponse.json({ success: false, message: "제품을 찾을 수 없습니다." }, { status: 404 });
  if (!supportsAnimalTraceLookup(product)) return NextResponse.json({ success: false, message: "공공데이터 조회는 소·돼지 제품만 지원합니다." }, { status: 400 });

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message ?? "이력번호를 확인해 주세요." }, { status: 400 });

  try {
    const data = await lookupAnimalTrace(parsed.data.historyNumber);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Animal trace API lookup failed", error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "공공 API 조회에 실패했습니다." }, { status: 502 });
  }
}
