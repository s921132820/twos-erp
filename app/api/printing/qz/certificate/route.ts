import { NextResponse } from "next/server";

export async function GET() {
  const certificate = process.env.QZ_CERTIFICATE;
  if (!certificate) return new NextResponse(null, { status: 204 });
  return new NextResponse(certificate.replaceAll("\\n", "\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
