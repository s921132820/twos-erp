"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="mx-auto flex min-h-[420px] max-w-[1500px] flex-col items-center justify-center rounded-lg border border-red-100 bg-white text-center"><div className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700">오류</div><h2 className="mt-4 text-xl font-bold text-slate-900">제품 정보를 불러오지 못했습니다.</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">MySQL 실행 상태와 DATABASE_URL 설정을 확인한 뒤 다시 시도해 주세요.</p><Button className="mt-5" onClick={reset}>다시 시도</Button></div>;
}
