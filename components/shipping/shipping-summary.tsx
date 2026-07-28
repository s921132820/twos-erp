"use client";

import type { ConvertedShippingRow } from "@/lib/shipping/types";

export function ShippingSummary({ orders }: { orders: ConvertedShippingRow[] }) {
  const count = (source: ConvertedShippingRow["source"]) => orders.filter((row) => row.source === source).length;
  const valid = orders.filter((row) => row.validation.isValid).length;
  const items = [["미트박스", count("meatbox")], ["쿠팡윙", count("coupang-wing")], ["스마트스토어", count("smart-store")], ["미트프렌즈", count("meatfriends")], ["수동 입력", count("manual")], ["전체 주문", orders.length], ["정상 주문", valid], ["확인 필요", orders.length - valid]] as const;
  return <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-8">{items.map(([label, value]) => <div key={label} className="min-w-0 rounded-md border border-slate-200 bg-white p-3"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-0.5 truncate text-lg font-bold text-slate-900">{value}건</p></div>)}</div>;
}
