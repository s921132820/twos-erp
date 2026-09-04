"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MARKETPLACE_LABELS } from "@/lib/shipping/marketplace-detector";
import { createInitialManualForm, createManualShippingRow } from "@/lib/shipping/manual-shipping";
import { parseMarketplaceExcelWithReport } from "@/lib/shipping/parse-marketplace-excel";
import { parseEncryptedSmartStoreExcel } from "@/lib/shipping/parse-encrypted-smart-store-excel";
import { parseMeatfriendsFile } from "@/lib/shipping/parse-meatfriends-file";
import { groupShippingRowsByProduct } from "@/lib/shipping/product-summary";
import type { ProductSummaryExportRow } from "@/lib/shipping/export-product-summary";
import type { ConvertedShippingRow, HanjinShippingRow, ManualShippingForm, ManualShippingRow, MarketplaceType, MarketplaceUploadState } from "@/lib/shipping/types";
import { validateShippingRow } from "@/lib/shipping/validation";
import { ManualOrderDialog, type ManualOrderDialogMode } from "./manual-order-dialog";
import { MarketplaceUploadCard } from "./marketplace-upload-card";
import { ShippingDownloadButton } from "./shipping-download-button";
import { ShippingResultTabs } from "./shipping-result-tabs";
import { ShippingRowEditDialog } from "./shipping-row-edit-dialog";
import { ShippingSummary } from "./shipping-summary";

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls"];
const createInitialUploadState = (): MarketplaceUploadState => ({ file: null, fileName: "", rows: [], error: null, notice: null, isLoading: false, status: "idle" });

function meatboxFilterNotice(report: NonNullable<ReturnType<typeof parseMarketplaceExcelWithReport>["meatboxReport"]>): string | null {
  if (!report.excludedCount) return null;
  const details = Object.entries(report.excludedDateCounts).sort(([left], [right]) => left.localeCompare(right)).map(([date, count]) => `- ${date}: ${count}건`);
  if (report.invalidDateCount) details.push(`- 날짜 없음/인식 실패: ${report.invalidDateCount}건`);
  return [`출고예정일자를 확인해 주세요.`, `오늘(${report.today}) 출고 예정이 아닌 주문 ${report.excludedCount}건을 송장 변환에서 제외했습니다.`, ...(details.length ? ["", "제외된 출고예정일자:", ...details] : [])].join("\n");
}
type ManualDialogState = { open: boolean; mode: ManualOrderDialogMode; editingRowId: string | null; initialValues: ManualShippingForm };

export function ShippingLabelConverter() {
  const [meatboxState, setMeatboxState] = useState<MarketplaceUploadState>(createInitialUploadState);
  const [coupangWingState, setCoupangWingState] = useState<MarketplaceUploadState>(createInitialUploadState);
  const [smartStoreState, setSmartStoreState] = useState<MarketplaceUploadState>(createInitialUploadState);
  const [meatfriendsState, setMeatfriendsState] = useState<MarketplaceUploadState>(createInitialUploadState);
  const [manualRows, setManualRows] = useState<ManualShippingRow[]>([]);
  const [overrides, setOverrides] = useState<Record<string, HanjinShippingRow>>({});
  const [excludedRowKeys, setExcludedRowKeys] = useState<Set<string>>(new Set());
  const [editingRow, setEditingRow] = useState<ConvertedShippingRow | null>(null);
  const [productSummaryRows, setProductSummaryRows] = useState<ProductSummaryExportRow[]>([]);
  const [manualDialog, setManualDialog] = useState<ManualDialogState>({ open: false, mode: "create", editingRowId: null, initialValues: createInitialManualForm() });
  const requestIds = useRef<Record<MarketplaceType, number>>({ meatbox: 0, "coupang-wing": 0, "smart-store": 0, meatfriends: 0 });

  const baseRows = useMemo(() => [...meatboxState.rows, ...coupangWingState.rows, ...smartStoreState.rows, ...meatfriendsState.rows, ...manualRows], [meatboxState.rows, coupangWingState.rows, smartStoreState.rows, meatfriendsState.rows, manualRows]);
  const allRows = useMemo(() => baseRows.map((row) => { const changed = overrides[row.rowKey]; return changed ? { ...row, ...changed, validation: validateShippingRow(changed) } : row; }), [baseRows, overrides]);
  const activeRows = useMemo(() => allRows.filter((row) => !excludedRowKeys.has(row.rowKey)), [allRows, excludedRowKeys]);
  const groupedProducts = useMemo(() => groupShippingRowsByProduct(activeRows), [activeRows]);
  const productSummaryResetKey = useMemo(() => JSON.stringify(activeRows), [activeRows]);
  const handleProductSummaryChange = useCallback((rows: ProductSummaryExportRow[]) => setProductSummaryRows(rows), []);
  const isLoading = meatboxState.isLoading || coupangWingState.isLoading || smartStoreState.isLoading || meatfriendsState.isLoading;

  const setMarketplaceState = (marketplace: MarketplaceType, state: MarketplaceUploadState) => {
    if (marketplace === "meatbox") setMeatboxState(state); else if (marketplace === "coupang-wing") setCoupangWingState(state); else if (marketplace === "smart-store") setSmartStoreState(state); else setMeatfriendsState(state);
  };
  const clearSourceAdjustments = (marketplace: MarketplaceType) => {
    const prefix = `${marketplace}:`;
    setOverrides((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(prefix))));
    setExcludedRowKeys((current) => new Set([...current].filter((key) => !key.startsWith(prefix))));
  };
  const handleFile = async (marketplace: MarketplaceType, file: File) => {
    clearSourceAdjustments(marketplace);
    const requestId = ++requestIds.current[marketplace];
    const loadingState: MarketplaceUploadState = { file, fileName: file.name, rows: [], error: null, notice: null, isLoading: true, status: marketplace === "smart-store" ? "decrypting" : "parsing" };
    setMarketplaceState(marketplace, loadingState);
    const validExtension = marketplace === "smart-store" ? file.name.toLowerCase().endsWith(".xlsx") : ACCEPTED_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension));
    if (!validExtension) { const message = marketplace === "smart-store" ? "암호화된 스마트스토어 .xlsx 파일만 업로드할 수 있습니다." : ".xlsx 또는 .xls 파일만 업로드할 수 있습니다."; if (requestIds.current[marketplace] === requestId) setMarketplaceState(marketplace, { ...loadingState, error: message, isLoading: false, status: "error" }); return; }
    try {
      const data = await file.arrayBuffer();
      const parsed = marketplace === "smart-store" ? { rows: await parseEncryptedSmartStoreExcel(data, file.name, () => { if (requestIds.current[marketplace] === requestId) setMarketplaceState(marketplace, { ...loadingState, status: "parsing" }); }), meatboxReport: null } : marketplace === "meatfriends" ? { rows: parseMeatfriendsFile(data, file.name), meatboxReport: null } : parseMarketplaceExcelWithReport(data, marketplace, file.name);
      const { rows, meatboxReport } = parsed;
      const notice = meatboxReport ? meatboxFilterNotice(meatboxReport) : null;
      const error = meatboxReport && rows.length === 0
        ? `오늘 출고 예정인 주문이 없습니다.\n\n업로드한 미트박스 파일에 오늘(${meatboxReport.today}) 출고 예정인 주문이 없습니다.\n\n출고예정일자를 확인해 주세요.`
        : rows.length ? null : "변환할 주문 데이터가 없습니다.";
      if (requestIds.current[marketplace] !== requestId) return;
      setMarketplaceState(marketplace, { file, fileName: file.name, rows, error, notice, isLoading: false, status: error ? "error" : "success" });
      if (notice) toast.warning(`미트박스 주문 ${meatboxReport!.excludedCount}건을 출고예정일자 기준으로 제외했습니다.`);
      if (rows.length) toast.success(`${MARKETPLACE_LABELS[marketplace]} 주문 ${rows.length}건을 변환했습니다.`);
    } catch (cause) { if (requestIds.current[marketplace] === requestId) setMarketplaceState(marketplace, { file, fileName: file.name, rows: [], error: cause instanceof Error ? cause.message : "엑셀 파일을 처리하지 못했습니다.", notice: null, isLoading: false, status: "error" }); }
  };
  const removeMarketplace = (marketplace: MarketplaceType) => { requestIds.current[marketplace] += 1; clearSourceAdjustments(marketplace); setMarketplaceState(marketplace, createInitialUploadState()); };
  const addManual = (form: ManualShippingForm) => { const row = createManualShippingRow(form); if (!row) { toast.error("받는 분, 주소, 휴대전화, 물품명 중 하나 이상을 입력해 주세요."); return false; } setManualRows((current) => [...current, row]); toast.success("수동 주문을 추가했습니다."); return true; };
  const deleteManual = (row: ConvertedShippingRow) => { setManualRows((current) => current.filter((item) => item.rowKey !== row.rowKey)); setOverrides((current) => { const next = { ...current }; delete next[row.rowKey]; return next; }); setExcludedRowKeys((current) => { const next = new Set(current); next.delete(row.rowKey); return next; }); };
  const saveEdit = (changed: HanjinShippingRow) => { if (!editingRow) return; if (editingRow.source === "manual") setManualRows((current) => current.map((row) => row.rowKey === editingRow.rowKey ? { ...row, ...changed, validation: validateShippingRow(changed) } : row)); else setOverrides((current) => ({ ...current, [editingRow.rowKey]: changed })); };
  const openCreateManual = () => setManualDialog({ open: true, mode: "create", editingRowId: null, initialValues: createInitialManualForm() });
  const openEdit = (row: ConvertedShippingRow) => {
    if (row.source !== "manual") { setEditingRow(row); return; }
    const manual = row as ManualShippingRow;
    setManualDialog({ open: true, mode: "edit", editingRowId: manual.id, initialValues: { receiverName: manual.receiverName, postalCode: manual.postalCode, address: manual.address, phone: manual.phone, mobilePhone: manual.mobilePhone, packageQuantity: manual.packageQuantity, productName: manual.productName, deliveryMessage: manual.deliveryMessage, shippingFareType: manual.shippingFareType, selectedClientId: manual.selectedClientId, phoneWasManuallyEdited: Boolean(manual.phone) } });
  };
  const closeManualDialog = () => setManualDialog({ open: false, mode: "create", editingRowId: null, initialValues: createInitialManualForm() });
  const submitManualDialog = (form: ManualShippingForm) => {
    if (manualDialog.mode === "create") { if (!addManual(form)) return false; closeManualDialog(); return true; }
    const id = manualDialog.editingRowId; if (!id) return false;
    const replacement = createManualShippingRow(form, id); if (!replacement) return false;
    setManualRows((current) => current.map((row) => row.id === id ? replacement : row));
    toast.success("수동 주문을 수정했습니다."); closeManualDialog(); return true;
  };
  const toggleExclude = (rowKey: string) => setExcludedRowKeys((current) => { const next = new Set(current); if (next.has(rowKey)) next.delete(rowKey); else next.add(rowKey); return next; });
  const resetAll = () => { requestIds.current.meatbox += 1; requestIds.current["coupang-wing"] += 1; requestIds.current["smart-store"] += 1; requestIds.current.meatfriends += 1; setMeatboxState(createInitialUploadState()); setCoupangWingState(createInitialUploadState()); setSmartStoreState(createInitialUploadState()); setMeatfriendsState(createInitialUploadState()); setManualRows([]); setOverrides({}); setExcludedRowKeys(new Set()); setEditingRow(null); closeManualDialog(); };

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-bold text-slate-900">택배 송장 변환</h2><p className="mt-1 text-sm text-slate-500">판매처 주문과 수동 주문을 한진택배 송장 엑셀로 통합합니다.</p></div><Button type="button" className="w-full sm:w-auto" onClick={openCreateManual}><Plus size={16} />수동 주문 추가</Button></div>
    <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-4"><MarketplaceUploadCard marketplace="meatbox" state={meatboxState} onFile={(file) => void handleFile("meatbox", file)} onRemove={() => removeMarketplace("meatbox")} /><MarketplaceUploadCard marketplace="coupang-wing" state={coupangWingState} onFile={(file) => void handleFile("coupang-wing", file)} onRemove={() => removeMarketplace("coupang-wing")} /><MarketplaceUploadCard marketplace="smart-store" state={smartStoreState} onFile={(file) => void handleFile("smart-store", file)} onRemove={() => removeMarketplace("smart-store")} /><MarketplaceUploadCard marketplace="meatfriends" state={meatfriendsState} onFile={(file) => void handleFile("meatfriends", file)} onRemove={() => removeMarketplace("meatfriends")} /></div>
    <section className="space-y-3"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-900">통합 변환 결과</h3><p className="mt-1 text-sm text-slate-500">제외된 엑셀 행은 목록에 남지만 요약과 다운로드에는 포함되지 않습니다.</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={resetAll}><RotateCcw size={16} />전체 초기화</Button><ShippingDownloadButton orders={activeRows} productSummaryRows={productSummaryRows} isLoading={isLoading} /></div></div><ShippingSummary orders={activeRows} /></section>
    <ShippingResultTabs finalRows={activeRows} allRows={allRows} groupedProducts={groupedProducts} productSummaryResetKey={productSummaryResetKey} excludedRowKeys={excludedRowKeys} onProductSummaryChange={handleProductSummaryChange} onEdit={openEdit} onToggleExclude={toggleExclude} onDeleteManual={deleteManual} />
    <ShippingRowEditDialog row={editingRow} onClose={() => setEditingRow(null)} onSave={saveEdit} />
    <ManualOrderDialog key={`${manualDialog.mode}-${manualDialog.editingRowId ?? "new"}-${manualDialog.open}`} open={manualDialog.open} mode={manualDialog.mode} initialValues={manualDialog.initialValues} onOpenChange={(open) => { if (!open) closeManualDialog(); }} onSubmit={submitManualDialog} />
  </div>;
}
