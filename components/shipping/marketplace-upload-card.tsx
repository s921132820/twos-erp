"use client";

import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { FileSpreadsheet, LoaderCircle, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MARKETPLACE_LABELS } from "@/lib/shipping/marketplace-detector";
import type { MarketplaceType, MarketplaceUploadState } from "@/lib/shipping/types";

export function MarketplaceUploadCard({ marketplace, state, onFile, onRemove }: { marketplace: MarketplaceType; state: MarketplaceUploadState; onFile: (file: File) => void; onRemove: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null); const [dragging, setDragging] = useState(false);
  const label = MARKETPLACE_LABELS[marketplace]; const validCount = state.rows.filter((row) => row.validation.isValid).length; const warningCount = state.rows.length - validCount;
  const accept = marketplace === "smart-store" ? ".xlsx" : ".xlsx,.xls";
  const description = marketplace === "smart-store" ? "암호 파일 · 비밀번호 1234 자동 처리" : marketplace === "meatfriends" ? "미트프렌즈 주문 엑셀 파일을 업로드해 주세요." : "주문 엑셀을 업로드해 주세요.";
  const statusMessage = state.status === "decrypting" ? "암호 파일 처리 중..." : state.status === "parsing" ? "파일을 읽는 중..." : null;
  const choose = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) onFile(file); event.target.value = ""; };
  const drop = (event: DragEvent<HTMLElement>) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) onFile(file); };
  return <article onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop} className={`flex h-full min-w-0 flex-col rounded-lg border bg-white p-3 shadow-sm transition-colors ${dragging ? "border-blue-500 bg-blue-50/40" : "border-slate-200"}`}>
    <div className="min-h-10"><h3 className="text-sm font-semibold text-slate-900">{label}</h3><p className="mt-0.5 text-xs text-slate-500">{description}</p></div>
    <input ref={inputRef} id={`${marketplace}-file`} type="file" accept={accept} onChange={choose} aria-label={`${label} 주문 엑셀 업로드`} className="sr-only" />
    {!state.fileName ? <button type="button" disabled={state.isLoading} onClick={() => inputRef.current?.click()} className="mt-3 flex min-h-20 w-full flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-center transition-colors hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50"><Upload className="size-5 text-slate-400" /><span className="mt-1.5 text-xs font-semibold text-slate-700">파일 선택 또는 드래그</span><span className="mt-0.5 text-[11px] text-slate-500">{marketplace === "smart-store" ? ".xlsx" : ".xlsx, .xls"}</span></button> : <div className="mt-3 flex flex-1 flex-col rounded-md border border-slate-200 bg-slate-50/70 p-2.5">
      <p className="min-w-0 truncate text-sm font-medium text-slate-800" title={state.fileName}><FileSpreadsheet className="mr-1.5 inline size-4 text-slate-500" />{state.fileName}</p>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500"><span>주문 <b className="text-slate-700">{state.rows.length}건</b></span><span>정상 <b className="text-emerald-700">{validCount}건</b></span><span>확인 필요 <b className="text-amber-700">{warningCount}건</b></span></div>
      {statusMessage && <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-700"><LoaderCircle className="size-3.5 animate-spin" />{statusMessage}</p>}
      <div className="mt-auto flex gap-1.5 pt-2"><Button type="button" size="sm" variant="outline" disabled={state.isLoading} onClick={() => inputRef.current?.click()} className="h-8">파일 교체</Button><Button type="button" size="sm" variant="ghost" onClick={onRemove} className="h-8"><Trash2 size={14} />제거</Button></div>
    </div>}
    {state.error && <div role="alert" className="mt-2 max-h-24 overflow-auto whitespace-pre-line rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">{state.error}</div>}
  </article>;
}
