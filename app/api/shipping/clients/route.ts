import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (query.length < 2) return NextResponse.json({ success: true, data: [] });

  try {
    const clients = await prisma.client.findMany({
      where: { OR: [
        { companyName: { contains: query } }, { consigneeName: { contains: query } },
        { telephone: { contains: query } }, { mobilePhone: { contains: query } }, { address: { contains: query } },
      ] },
      take: 20,
      orderBy: [{ companyName: "asc" }, { id: "asc" }],
      select: { id: true, companyName: true, consigneeName: true, postalCode: true, address: true, telephone: true, mobilePhone: true, mainProduct: true, deliveryMessage: true },
    });
    return NextResponse.json({ success: true, data: clients.map((client) => ({
      id: client.id, companyName: client.companyName, consigneeName: client.consigneeName,
      postalCode: client.postalCode, address: client.address, phone: client.telephone,
      mobilePhone: client.mobilePhone, primaryProduct: client.mainProduct, deliveryMessage: client.deliveryMessage,
    })) });
  } catch {
    return NextResponse.json({ success: false, data: [], message: "거래처 검색에 실패했습니다. 직접 입력은 계속 사용할 수 있습니다." }, { status: 503 });
  }
}
