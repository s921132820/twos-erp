import { NextResponse } from "next/server";
import { getClient } from "@/lib/clients/queries";

type Params = Promise<{ clientId: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  const { clientId } = await params;
  const client = await getClient(decodeURIComponent(clientId));
  if (!client) return NextResponse.json({ success: false, message: "거래처를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ success: true, data: client });
}
