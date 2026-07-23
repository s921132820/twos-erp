import { createSign } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({ request: z.string().min(1).max(1_000_000) });

export async function POST(request: Request) {
  const privateKey = process.env.QZ_PRIVATE_KEY;
  if (!privateKey) return NextResponse.json({ message: "QZ 서명 키가 설정되지 않았습니다." }, { status: 503 });
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: "서명할 요청이 올바르지 않습니다." }, { status: 400 });
  const signer = createSign("SHA512");
  signer.update(parsed.data.request);
  signer.end();
  return new NextResponse(signer.sign(privateKey.replaceAll("\\n", "\n"), "base64"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
