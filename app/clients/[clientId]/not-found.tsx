import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ClientNotFound() {
  return (
    <div className="mx-auto flex min-h-[420px] max-w-5xl flex-col items-center justify-center rounded-xl border border-slate-200 bg-white text-center">
      <h2 className="text-xl font-bold text-slate-900">거래처를 찾을 수 없습니다.</h2>
      <p className="mt-2 text-sm text-slate-500">삭제되었거나 올바르지 않은 거래처 ID입니다.</p>
      <Button asChild className="mt-5"><Link href="/clients">거래처 목록으로 이동</Link></Button>
    </div>
  );
}
