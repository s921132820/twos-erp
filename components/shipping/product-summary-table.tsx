"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { commitProductSummaryName, createEditableProductSummaries, normalizeSummaryQuantity } from "@/lib/shipping/editable-product-summary";
import type { EditableProductSummary, ProductQuantitySummary } from "@/lib/shipping/types";

export function ProductSummaryTable({ groups }: { groups: ProductQuantitySummary[] }) {
  const [rows, setRows] = useState<EditableProductSummary[]>(() => createEditableProductSummaries(groups));
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({});
  const changeName = (id: string, value: string) => setRows((current) => current.map((row) => row.id === id ? { ...row, productName: value } : row));
  const commitName = (id: string) => setRows((current) => commitProductSummaryName(current, id));
  const changeQuantity = (id: string, value: string) => {
    setQuantityDrafts((current) => ({ ...current, [id]: value }));
    if (value.trim() === "") return;
    const parsed = Number(value); if (!Number.isInteger(parsed) || parsed < 0) return;
    setRows((current) => current.map((row) => row.id === id ? { ...row, quantity: parsed } : row));
  };
  const commitQuantity = (id: string) => {
    setRows((current) => current.map((row) => row.id === id ? { ...row, quantity: normalizeSummaryQuantity(quantityDrafts[id] ?? String(row.quantity), row.quantity) } : row));
    setQuantityDrafts((current) => { const next = { ...current }; delete next[id]; return next; });
  };
  const remove = (row: EditableProductSummary) => {
    if (!window.confirm(`이 물품을 집계 목록에서 삭제하시겠습니까?\n통합 주문과 한진택배 엑셀에는 영향을 주지 않습니다.`)) return;
    setRows((current) => current.filter((item) => item.id !== row.id));
    setQuantityDrafts((current) => { const next = { ...current }; delete next[row.id]; return next; });
  };

  if (!rows.length) return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-600">표시할 물품이 없습니다.</div>;
  return <div className="space-y-2"><p className="text-xs text-slate-500">통합 주문이 변경되면 집계표의 수정 및 삭제 내용은 초기화됩니다.</p><div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[680px] table-fixed text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold text-slate-600"><tr><th className="w-16 border-b border-slate-200 px-4 py-3 text-right">번호</th><th className="border-b border-slate-200 px-4 py-3">물품명</th><th className="w-32 border-b border-slate-200 px-4 py-3">개수</th><th className="w-24 border-b border-slate-200 px-4 py-3 text-center">관리</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.id} className="border-b border-slate-100 last:border-0"><td className="px-4 py-3 text-right text-slate-500">{index + 1}</td><td className="px-4 py-2"><Input value={row.productName} onChange={(event) => changeName(row.id, event.target.value)} onBlur={() => commitName(row.id)} aria-label={`${index + 1}번 물품명`} /></td><td className="px-4 py-2"><Input type="number" min={0} step={1} value={quantityDrafts[row.id] ?? String(row.quantity)} onChange={(event) => changeQuantity(row.id, event.target.value)} onBlur={() => commitQuantity(row.id)} aria-label={`${row.productName} 개수`} /></td><td className="px-4 py-2 text-center"><Button type="button" variant="danger" size="sm" onClick={() => remove(row)}>삭제</Button></td></tr>)}</tbody></table></div></div></div>;
}
