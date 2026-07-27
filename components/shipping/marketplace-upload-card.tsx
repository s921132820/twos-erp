"use client";

import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { FileSpreadsheet, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MARKETPLACE_LABELS } from "@/lib/shipping/marketplace-detector";
import type { MarketplaceType, MarketplaceUploadState } from "@/lib/shipping/types";

export function MarketplaceUploadCard({ marketplace, state, onFile, onRemove }: { marketplace: MarketplaceType; state: MarketplaceUploadState; onFile: (file: File) => void; onRemove: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const label = MARKETPLACE_LABELS[marketplace];
  const validCount = state.rows.filter((row) => row.validation.isValid).length;
  const choose = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) onFile(file); event.target.value = ""; };
  const drop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) onFile(file); };
  const statusMessage = state.status === "decrypting" ? "암호화된 엑셀 파일을 확인하고 있습니다." : state.status === "parsing" ? "스마트스토어 주문 데이터를 읽고 있습니다." : null;
  return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div><h3 className="font-bold text-slate-900">{label} 주문 엑셀</h3><p className="mt-1 text-sm text-slate-500">{marketplace === "smart-store" ? "비밀번호가 설정된 스마트스토어 주문 파일을 업로드해주세요. 파일 비밀번호 1234는 자동으로 처리됩니다." : `${label} 주문 파일을 업로드해주세요.`}</p></div>
    <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop} className={`mt-4 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"}`}>
      <Upload className="mx-auto text-slate-400" size={28} /><p className="mt-2 text-sm font-semibold text-slate-700">파일 선택 또는 드래그 앤 드롭</p><p className="mt-1 text-xs text-slate-500">.xlsx, .xls · 파일 1개</p>
      <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={choose} className="sr-only" />
      <Button type="button" size="sm" className="mt-3" disabled={state.isLoading} onClick={() => inputRef.current?.click()}><FileSpreadsheet size={15} />{state.isLoading ? "처리 중..." : "엑셀 선택"}</Button>
    </div>
    {state.fileName && <div className="mt-4 rounded-lg border border-slate-200 p-3"><div className="flex items-center justify-between gap-2"><p className="min-w-0 truncate text-sm font-semibold text-slate-700"><FileSpreadsheet className="mr-1.5 inline" size={16} />{state.fileName}</p><Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label={`${label} 파일 제거`}><Trash2 size={16} /></Button></div><dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs"><div><dt className="text-slate-500">주문 수</dt><dd className="mt-1 font-bold">{state.rows.length}</dd></div><div><dt className="text-slate-500">정상</dt><dd className="mt-1 font-bold text-emerald-700">{validCount}</dd></div><div><dt className="text-slate-500">확인 필요</dt><dd className="mt-1 font-bold text-amber-700">{state.rows.length - validCount}</dd></div></dl></div>}
    {statusMessage && <p className="mt-3 rounded-lg bg-blue-50 p-3 text-sm font-medium text-blue-700">{statusMessage}</p>}
    {state.error && <p role="alert" className="mt-3 whitespace-pre-line rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{state.error}</p>}
  </article>;
}
