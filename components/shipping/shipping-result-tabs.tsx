"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { ConvertedShippingRow, ProductQuantitySummary } from "@/lib/shipping/types";
import { ProductSummaryTable } from "./product-summary-table";
import { ShippingPreviewTable } from "./shipping-preview-table";

type Props = { finalRows: ConvertedShippingRow[]; allRows: ConvertedShippingRow[]; groupedProducts: ProductQuantitySummary[]; excludedRowKeys: Set<string>; onEdit: (row: ConvertedShippingRow) => void; onToggleExclude: (rowKey: string) => void; onDeleteManual: (row: ConvertedShippingRow) => void };

export function ShippingResultTabs({ finalRows, allRows, groupedProducts, excludedRowKeys, onEdit, onToggleExclude, onDeleteManual }: Props) {
  const [tab, setTab] = useState<"combined" | "products">("combined");
  const warningCount = finalRows.filter((row) => !row.validation.isValid).length;
  return <div className="space-y-4">
    <div role="tablist" aria-label="배송 변환 결과" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
      <Tab active={tab === "combined"} onClick={() => setTab("combined")} controls="combined-panel">통합 변환 결과 <Count>{finalRows.length}</Count></Tab>
      <Tab active={tab === "products"} onClick={() => setTab("products")} controls="products-panel">물품별 집계 <Count>{groupedProducts.length}</Count></Tab>
    </div>
    <div id="combined-panel" role="tabpanel" hidden={tab !== "combined"}>{warningCount > 0 && <div className="mb-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800"><AlertTriangle className="mt-0.5 shrink-0" size={17} /><span>확인이 필요한 주문이 {warningCount}건 있습니다. 미리보기에서 누락 정보를 확인하거나 수정해 주세요.</span></div>}<ShippingPreviewTable orders={allRows} excludedRowKeys={excludedRowKeys} onEdit={onEdit} onToggleExclude={onToggleExclude} onDeleteManual={onDeleteManual} /></div>
    <div id="products-panel" role="tabpanel" hidden={tab !== "products"}><ProductSummaryTable groups={groupedProducts} /></div>
  </div>;
}

function Tab({ active, onClick, controls, children }: { active: boolean; onClick: () => void; controls: string; children: React.ReactNode }) { return <button type="button" role="tab" aria-selected={active} aria-controls={controls} onClick={onClick} className={`flex shrink-0 items-center rounded-md px-3 py-2 text-sm font-semibold transition-colors ${active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>{children}</button>; }
function Count({ children }: { children: React.ReactNode }) { return <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">{children}</span>; }
