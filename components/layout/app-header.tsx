"use client";

import { UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname();
  const pageTitle = pathname.startsWith("/label-printer")
    ? "라벨 프린터"
    : pathname.startsWith("/clients")
    ? "거래처"
    : pathname.includes("/import-histories")
    ? "수입축산물 이력"
    : pathname.startsWith("/products")
      ? "우리 제품"
      : "홈";

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-slate-900">{pageTitle}</h1>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">로컬 시스템</span>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><UserRound size={17} aria-hidden="true" /> 관리자</div>
    </header>
  );
}
