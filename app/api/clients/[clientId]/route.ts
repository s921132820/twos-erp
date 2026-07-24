import { NextResponse } from "next/server";
import { getClient } from "@/lib/clients/queries";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ clientId: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  const { clientId } = await params;
  const client = await getClient(decodeURIComponent(clientId));
  if (!client) return NextResponse.json({ success: false, message: "거래처를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ success: true, data: client });
}

export async function DELETE(_: Request, { params }: { params: Params }) {
  const { clientId } = await params;
  try {
    await prisma.client.delete({ where: { id: decodeURIComponent(clientId) } });
    return NextResponse.json({ success: true, message: "거래처를 삭제했습니다." });
  } catch {
    return NextResponse.json({ success: false, message: "거래처를 삭제하지 못했습니다." }, { status: 404 });
  }
}
