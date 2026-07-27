"use client";

import type { ConvertedShippingRow } from "@/lib/shipping/types";

export function ShippingSummary({ orders }: { orders: ConvertedShippingRow[] }) {
  const meatbox = orders.filter((row) => row.source === "meatbox").length;
  const coupang = orders.filter((row) => row.source === "coupang-wing").length;
  const smartStore = orders.filter((row) => row.source === "smart-store").length;
  const valid = orders.filter((row) => row.validation.isValid).length;
  const items = [["미트박스", `${meatbox}건`], ["쿠팡윙", `${coupang}건`], ["스마트스토어", `${smartStore}건`], ["전체 주문", `${orders.length}건`], ["정상 주문", `${valid}건`], ["확인 필요", `${orders.length - valid}건`]] as const;
  return <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">{items.map(([label, value]) => <div key={label} className="min-w-0 rounded-md border border-slate-200 bg-white p-3"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-0.5 truncate text-lg font-bold text-slate-900" title={String(value)}>{value}</p></div>)}</div>;
}
