import Link from "next/link";
import { Package } from "lucide-react";

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 bg-slate-900 text-white lg:block">
      <div className="flex h-16 items-center border-b border-slate-800 px-6 text-lg font-bold">투에스푸드 ERP</div>
      <nav aria-label="주 메뉴" className="p-3">
        <Link href="/products" className="flex items-center gap-3 rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold shadow-sm" aria-current="page">
          <Package aria-hidden="true" size={18} /> 우리 제품
        </Link>
      </nav>
    </aside>
  );
}
