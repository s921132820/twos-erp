import { NextRequest, NextResponse } from "next/server";
import { getClients } from "@/lib/clients/queries";
import { createClientRecord } from "@/lib/clients/mutations";
import { clientSchema } from "@/lib/validations/client";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") ?? "";
  const page = Number(request.nextUrl.searchParams.get("page"));
  const limit = Number(request.nextUrl.searchParams.get("limit"));
  const result = await getClients({ search, page, limit });
  return NextResponse.json({
    success: true,
    data: result.clients,
    pagination: {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      limit: result.limit,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        message: "입력 내용을 확인해 주세요.",
        errors: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }
    const client = await createClientRecord(parsed.data);
    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error) {
    console.error("Client POST failed", error);
    return NextResponse.json({ success: false, message: "거래처를 등록하지 못했습니다." }, { status: 500 });
  }
}
