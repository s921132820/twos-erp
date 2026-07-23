import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <div className="mx-auto flex min-h-[420px] max-w-[1500px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white text-center"><h2 className="text-xl font-bold text-slate-900">제품을 찾을 수 없습니다.</h2><p className="mt-2 text-sm text-slate-500">삭제됐거나 올바르지 않은 제품 ID입니다.</p><Button asChild className="mt-5"><Link href="/products">우리 제품으로 이동</Link></Button></div>;
}
