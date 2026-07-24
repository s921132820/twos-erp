"use client";

import Link from "next/link";
import { Building2, Home, Package, Printer } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const menus = [
    { href: "/", label: "홈", icon: Home, active: pathname === "/" },
    { href: "/clients", label: "거래처", icon: Building2, active: pathname.startsWith("/clients") },
    { href: "/products", label: "우리 제품", icon: Package, active: pathname.startsWith("/products") },
    { href: "/label-printer", label: "라벨 프린터", icon: Printer, active: pathname.startsWith("/label-printer") },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 bg-slate-900 text-white lg:block">
      <div className="flex h-16 items-center border-b border-slate-800 px-6 text-lg font-bold">투에스푸드 ERP</div>
      <nav aria-label="주 메뉴" className="space-y-1 p-3">
        {menus.map(({ href, label, icon: Icon, active }) => (
          <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white", active && "bg-blue-600 text-white shadow-sm hover:bg-blue-600")} aria-current={active ? "page" : undefined}>
            <Icon aria-hidden="true" size={18} /> {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
