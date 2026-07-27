"use client";

import { useMemo, useRef, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MARKETPLACE_LABELS } from "@/lib/shipping/marketplace-detector";
import { parseMarketplaceExcel } from "@/lib/shipping/parse-marketplace-excel";
import type { MarketplaceType, MarketplaceUploadState } from "@/lib/shipping/types";
import { MarketplaceUploadCard } from "./marketplace-upload-card";
import { ShippingDownloadButton } from "./shipping-download-button";
import { ShippingPreviewTable } from "./shipping-preview-table";
import { ShippingSummary } from "./shipping-summary";

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls"];

function createInitialUploadState(): MarketplaceUploadState {
  return { file: null, fileName: "", rows: [], error: null, isLoading: false };
}

export function ShippingLabelConverter() {
  const [meatboxState, setMeatboxState] = useState<MarketplaceUploadState>(createInitialUploadState);
  const [coupangWingState, setCoupangWingState] = useState<MarketplaceUploadState>(createInitialUploadState);
  const requestIds = useRef<Record<MarketplaceType, number>>({ meatbox: 0, "coupang-wing": 0 });
  const combinedRows = useMemo(() => [...meatboxState.rows, ...coupangWingState.rows], [meatboxState.rows, coupangWingState.rows]);
  const warningCount = combinedRows.filter((row) => !row.validation.isValid).length;
  const isLoading = meatboxState.isLoading || coupangWingState.isLoading;

  const setMarketplaceState = (marketplace: MarketplaceType, state: MarketplaceUploadState) => {
    if (marketplace === "meatbox") setMeatboxState(state); else setCoupangWingState(state);
  };
  const handleFile = async (marketplace: MarketplaceType, file: File) => {
    const requestId = ++requestIds.current[marketplace];
    const loadingState: MarketplaceUploadState = { file, fileName: file.name, rows: [], error: null, isLoading: true };
    setMarketplaceState(marketplace, loadingState);
    if (!ACCEPTED_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension))) {
      if (requestIds.current[marketplace] === requestId) setMarketplaceState(marketplace, { ...loadingState, error: ".xlsx 또는 .xls 파일만 업로드할 수 있습니다.", isLoading: false });
      return;
    }
    try {
      const rows = parseMarketplaceExcel(await file.arrayBuffer(), marketplace, file.name);
      const error = rows.length ? null : "변환할 주문 데이터가 없습니다.";
      if (requestIds.current[marketplace] !== requestId) return;
      setMarketplaceState(marketplace, { file, fileName: file.name, rows, error, isLoading: false });
      if (rows.length) toast.success(`${MARKETPLACE_LABELS[marketplace]} 주문 ${rows.length}건을 변환했습니다.`);
    } catch (cause) {
      if (requestIds.current[marketplace] === requestId) setMarketplaceState(marketplace, { file, fileName: file.name, rows: [], error: cause instanceof Error ? cause.message : "엑셀 파일을 처리하지 못했습니다.", isLoading: false });
    }
  };
  const removeMarketplace = (marketplace: MarketplaceType) => { requestIds.current[marketplace] += 1; setMarketplaceState(marketplace, createInitialUploadState()); };
  const resetAll = () => { requestIds.current.meatbox += 1; requestIds.current["coupang-wing"] += 1; setMeatboxState(createInitialUploadState()); setCoupangWingState(createInitialUploadState()); };

  return <div className="space-y-6">
    <div><h2 className="text-2xl font-bold text-slate-900">택배 송장 변환</h2><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-500">{"여러 판매처의 주문 파일을 등록한 뒤\n하나의 한진택배 엑셀 파일로 변환할 수 있습니다."}</p></div>
    <div className="grid gap-5 xl:grid-cols-2">
      <MarketplaceUploadCard marketplace="meatbox" state={meatboxState} onFile={(file) => void handleFile("meatbox", file)} onRemove={() => removeMarketplace("meatbox")} />
      <MarketplaceUploadCard marketplace="coupang-wing" state={coupangWingState} onFile={(file) => void handleFile("coupang-wing", file)} onRemove={() => removeMarketplace("coupang-wing")} />
    </div>
    <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-900">통합 변환 결과</h3><p className="mt-1 text-sm text-slate-500">미트박스 주문 다음에 쿠팡윙 주문이 원본 순서대로 표시됩니다.</p></div><Button type="button" variant="outline" onClick={resetAll} disabled={!meatboxState.file && !coupangWingState.file}><RotateCcw size={16} />전체 초기화</Button></div><ShippingSummary orders={combinedRows} /></section>
    {warningCount > 0 && <div className="flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800"><AlertTriangle className="mt-0.5 shrink-0" size={17} /><span>확인 필요한 주문이 {warningCount}건 있습니다. 미리보기에서 누락된 정보를 확인해주세요.</span></div>}
    <ShippingPreviewTable orders={combinedRows} />
    <div className="flex justify-end"><ShippingDownloadButton orders={combinedRows} isLoading={isLoading} /></div>
  </div>;
}
