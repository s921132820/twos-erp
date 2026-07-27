"use client";

import type { ProductQuantitySummary } from "@/lib/shipping/types";

export function ProductSummaryTable({ groups }: { groups: ProductQuantitySummary[] }) {
  if (!groups.length) return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500"><p className="font-semibold text-slate-700">집계할 물품이 없습니다.</p><p className="mt-1">판매처 주문 파일을 업로드하거나 수동 주문을 추가해 주세요.</p></div>;
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><table className="w-full table-fixed text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold text-slate-600"><tr><th className="w-16 border-b border-slate-200 px-4 py-3 text-right">번호</th><th className="border-b border-slate-200 px-4 py-3">물품명</th><th className="w-24 border-b border-slate-200 px-4 py-3 text-right">개수</th></tr></thead><tbody>{groups.map((group, index) => <tr key={group.key} className="border-b border-slate-100 last:border-0"><td className="px-4 py-3 text-right text-slate-500">{index + 1}</td><td className="px-4 py-3 font-semibold text-slate-900" title={group.productName}><span className="block break-words">{group.productName}</span></td><td className="px-4 py-3 text-right font-semibold">{group.quantity}개</td></tr>)}</tbody></table></div>;
}
