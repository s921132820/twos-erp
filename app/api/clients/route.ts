import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getClients } from "@/lib/clients/queries";
import { ClientIdAllocationError, createClientRecord } from "@/lib/clients/mutations";
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
    if (error instanceof ClientIdAllocationError) {
      console.error("[CLIENT_ID_ALLOCATION_ERROR]", { name: error.name, message: error.message });
      return NextResponse.json({ success: false, message: "거래처 ID를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("[CLIENT_CREATE_ERROR]", { code: error.code, message: error.message, meta: error.meta });
      if (error.code === "P2002") {
        return NextResponse.json({ success: false, message: "이미 등록된 거래처입니다." }, { status: 409 });
      }
    } else {
      console.error("[CLIENT_CREATE_ERROR]", error);
    }
    return NextResponse.json({ success: false, message: "거래처 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
