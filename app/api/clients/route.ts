import { NextRequest, NextResponse } from "next/server";
import { getClients } from "@/lib/clients/queries";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query") ?? "";
  const clients = await getClients({ query });
  return NextResponse.json({ success: true, data: clients });
}
