"use client";

import { startTransition, useActionState, useCallback, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { ImportLivestockHistory, Prisma } from "@prisma/client";
import { Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createImportHistory, updateImportHistory } from "@/app/products/import-history-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialImportHistoryFormState } from "@/lib/validations/import-livestock-history";
import { supportsAnimalTraceLookup } from "@/lib/products/is-goat-product";
import { requiresImportTraceNumber } from "@/lib/products/import-trace-requirement";

export type ProductWithImportHistories = Prisma.ProductGetPayload<{ include: { importLivestockHistories: true } }>;

function dateOnly(value: Date | null): string {
  return value?.toISOString().slice(0, 10) || "-";
}

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.[0] ? <p className="mt-1 text-xs text-red-600">{messages[0]}</p> : null;
}

function HistoryForm({ product, history, onSuccess, onCancel, onDirtyChange }: { product: ProductWithImportHistories; history?: ImportLivestockHistory; onSuccess: (message: string) => void; onCancel: () => void; onDirtyChange: (dirty: boolean) => void }) {
  const productId = product.id;
  const lookupSupported = supportsAnimalTraceLookup(product);
  const action = history ? updateImportHistory.bind(null, history.id) : createImportHistory;
  const [state, formAction, pending] = useActionState(action, initialImportHistoryFormState);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const initialValues = useMemo(() => ({
    historyNumber: history?.historyNumber ?? "",
    importDate: history?.importDate?.toISOString().slice(0, 10) ?? "",
    countryOfOrigin: history?.countryOfOrigin ?? "",
    supplierName: history?.supplierName ?? "",
    itemName: history?.itemName ?? "",
    billOfLadingNumber: history?.billOfLadingNumber ?? "",
    exporterName: history?.exporterName ?? "",
    foreignSlaughterhouse: history?.foreignSlaughterhouse ?? "",
    foreignProcessingPlant: history?.foreignProcessingPlant ?? "",
    partNameCode: history?.partNameCode ?? "",
    foreignSlaughterDate: history?.foreignSlaughterDate?.toISOString().slice(0, 10) ?? "",
    expirationDate: history?.expirationDate?.toISOString().slice(0, 10) ?? "",
    memo: history?.memo ?? "",
    isActive: history?.isActive ?? true,
  }), [history]);
  const [values, setValues] = useState(initialValues);
  const historyNumberRequired = requiresImportTraceNumber({ category: product.category, countryOfOrigin: values.countryOfOrigin });
  useEffect(() => onDirtyChange(JSON.stringify(values) !== JSON.stringify(initialValues)), [initialValues, onDirtyChange, values]);
  useEffect(() => {
    if (state.status === "success") onSuccess(state.message);
    if (state.status === "error") toast.error(state.message);
  }, [state, onSuccess]);

  const change = (field: Exclude<keyof typeof values, "isActive">, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };
  const lookup = async () => {
    if (!values.historyNumber.trim()) {
      setLookupMessage("공공데이터 조회를 생략했습니다. 아래 정보를 직접 입력해 저장할 수 있습니다.");
      return;
    }
    setLookingUp(true);
    setLookupMessage("");
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(productId)}/import-histories/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historyNumber: values.historyNumber }),
      });
      const result = await response.json() as { success: boolean; message?: string; data?: { historyNumber: string; importDate: string; countryOfOrigin: string; supplierName: string; itemName: string; billOfLadingNumber: string; exporterName: string; foreignSlaughterhouse: string; foreignProcessingPlant: string; partNameCode: string; foreignSlaughterDate: string; memo: string; dateSource: string | null; supplierSource: string | null; missingFields: string[] } };
      if (!response.ok || !result.success || !result.data) throw new Error(result.message ?? "공공 API 조회에 실패했습니다.");
      setValues((current) => ({
        historyNumber: result.data?.historyNumber ?? current.historyNumber,
        importDate: result.data?.importDate || current.importDate,
        countryOfOrigin: result.data?.countryOfOrigin || current.countryOfOrigin,
        supplierName: result.data?.supplierName || current.supplierName,
        itemName: result.data?.itemName || current.itemName,
        billOfLadingNumber: result.data?.billOfLadingNumber || current.billOfLadingNumber,
        exporterName: result.data?.exporterName || current.exporterName,
        foreignSlaughterhouse: result.data?.foreignSlaughterhouse || current.foreignSlaughterhouse,
        foreignProcessingPlant: result.data?.foreignProcessingPlant || current.foreignProcessingPlant,
        partNameCode: result.data?.partNameCode || current.partNameCode,
        foreignSlaughterDate: result.data?.foreignSlaughterDate || current.foreignSlaughterDate,
        expirationDate: current.expirationDate,
        memo: current.memo,
        isActive: current.isActive,
      }));
      const sourceNotice = [result.data.dateSource ? `날짜: ${result.data.dateSource}` : "", result.data.supplierSource ? `업체: ${result.data.supplierSource}` : ""].filter(Boolean).join(", ");
      setLookupMessage(result.data.missingFields.length ? `조회했습니다. 제공되지 않은 항목은 직접 확인해 주세요.${sourceNotice ? ` (${sourceNotice})` : ""}` : `공공 API에서 이력정보를 불러왔습니다.${sourceNotice ? ` (${sourceNotice})` : ""}`);
    } catch (error) {
      setLookupMessage(error instanceof Error ? error.message : "공공 API 조회에 실패했습니다.");
    } finally {
      setLookingUp(false);
    }
  };

  return <form action={(formData) => startTransition(() => formAction(formData))} onSubmit={(event) => {
    if (!event.currentTarget.checkValidity()) {
      event.preventDefault();
      event.currentTarget.reportValidity();
    }
  }} className="space-y-4">
    <input type="hidden" name="productId" value={productId} />
    {state.status === "error" && <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.message}</div>}
    <div className={lookupSupported ? "rounded-lg border border-blue-100 bg-blue-50 p-4" : "rounded-lg border border-amber-200 bg-amber-50 p-4"}><p className={lookupSupported ? "text-sm font-semibold text-blue-900" : "text-sm font-semibold text-amber-900"}>수입축산물 이력번호 {historyNumberRequired && <span className="text-red-500">*</span>} <span className="font-normal">(공공데이터 조회는 선택)</span></p><p className={lookupSupported ? "mt-1 text-xs leading-5 text-blue-700" : "mt-1 text-xs leading-5 text-amber-800"}>{lookupSupported ? "수입산 소·돼지는 이력번호가 필수이며, 조회 버튼으로 제공 정보를 자동 입력할 수 있습니다." : "양·염소는 공공데이터 조회 대상이 아니며 이력번호 없이도 직접 입력하여 등록할 수 있습니다."}</p><div className="mt-3 flex gap-2"><Input required={historyNumberRequired} name="historyNumber" value={values.historyNumber} onChange={(event) => change("historyNumber", event.target.value)} maxLength={50} placeholder={historyNumberRequired ? "수입축산물 이력번호 (필수)" : "수입축산물 이력번호 (선택)"} className="bg-white" /><Button type="button" onClick={lookup} disabled={!lookupSupported || lookingUp}><Search size={16} />{lookingUp ? "조회 중..." : "공공 API 조회"}</Button></div>{lookupMessage && <p role="status" className="mt-2 text-xs font-medium text-blue-800">{lookupMessage}</p>}<FieldError messages={state.errors?.historyNumber} /></div>
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-medium text-slate-700">수입일자<Input type="date" name="importDate" value={values.importDate} onChange={(event) => change("importDate", event.target.value)} className="mt-1.5 bg-white" /><FieldError messages={state.errors?.importDate} /></label>
      <label className="text-sm font-medium text-slate-700">원산지 <span className="text-red-500">*</span><Input required name="countryOfOrigin" value={values.countryOfOrigin} onChange={(event) => change("countryOfOrigin", event.target.value)} maxLength={100} className="mt-1.5 bg-white" /><FieldError messages={state.errors?.countryOfOrigin} /></label>
      <label className="text-sm font-medium text-slate-700">공급처<Input name="supplierName" value={values.supplierName} onChange={(event) => change("supplierName", event.target.value)} maxLength={150} className="mt-1.5 bg-white" /><FieldError messages={state.errors?.supplierName} /></label>
      <label className="text-sm font-medium text-slate-700">품목명<Input name="itemName" value={values.itemName} onChange={(event) => change("itemName", event.target.value)} maxLength={200} className="mt-1.5 bg-white" /><FieldError messages={state.errors?.itemName} /></label>
      <label className="text-sm font-medium text-slate-700">B/L번호 <span className="text-red-500">*</span><Input required name="billOfLadingNumber" value={values.billOfLadingNumber} onChange={(event) => change("billOfLadingNumber", event.target.value)} maxLength={100} className="mt-1.5 bg-white" /><FieldError messages={state.errors?.billOfLadingNumber} /></label>
      <label className="text-sm font-medium text-slate-700">수출업체<Input name="exporterName" value={values.exporterName} onChange={(event) => change("exporterName", event.target.value)} maxLength={200} className="mt-1.5 bg-white" /><FieldError messages={state.errors?.exporterName} /></label>
      <label className="text-sm font-medium text-slate-700">부위명(코드)<Input name="partNameCode" value={values.partNameCode} onChange={(event) => change("partNameCode", event.target.value)} maxLength={200} className="mt-1.5 bg-white" /><FieldError messages={state.errors?.partNameCode} /></label>
      <label className="text-sm font-medium text-slate-700">수출국 도축장<Input name="foreignSlaughterhouse" value={values.foreignSlaughterhouse} onChange={(event) => change("foreignSlaughterhouse", event.target.value)} maxLength={500} className="mt-1.5 bg-white" /><FieldError messages={state.errors?.foreignSlaughterhouse} /></label>
      <label className="text-sm font-medium text-slate-700">수출국 가공장<Input name="foreignProcessingPlant" value={values.foreignProcessingPlant} onChange={(event) => change("foreignProcessingPlant", event.target.value)} maxLength={500} className="mt-1.5 bg-white" /><FieldError messages={state.errors?.foreignProcessingPlant} /></label>
      <label className="text-sm font-medium text-slate-700">수출국 도축일자<Input type="date" name="foreignSlaughterDate" value={values.foreignSlaughterDate} onChange={(event) => change("foreignSlaughterDate", event.target.value)} className="mt-1.5 bg-white" /><FieldError messages={state.errors?.foreignSlaughterDate} /></label>
      <label className="text-sm font-medium text-slate-700">유통기한<Input type="date" name="expirationDate" value={values.expirationDate} onChange={(event) => change("expirationDate", event.target.value)} className="mt-1.5 bg-white" /><FieldError messages={state.errors?.expirationDate} /></label>
    </div>
    <label className="block text-sm font-medium text-slate-700">메모<textarea name="memo" value={values.memo} onChange={(event) => change("memo", event.target.value)} maxLength={2000} rows={3} placeholder="업무상 필요한 일반 메모를 입력하세요." className="mt-1.5 w-full resize-y rounded-md border border-slate-300 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><FieldError messages={state.errors?.memo} /></label>
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" name="isActive" checked={values.isActive} onChange={(event) => setValues((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 accent-blue-600" />사용 중인 이력</label>
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>취소</Button><Button type="submit" disabled={pending}>{pending ? "저장 중..." : history ? "수정 저장" : "이력 등록"}</Button></div>
  </form>;
}

export function ImportHistoryManager({ product }: { product: ProductWithImportHistories }) {
  const [editing, setEditing] = useState<ImportLivestockHistory>();
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const router = useRouter();
  const close = useCallback(() => { setOpen(false); setEditing(undefined); setDirty(false); }, []);
  const requestClose = useCallback(() => {
    if (dirty && !window.confirm("입력 중인 내용이 있습니다. 변경 사항을 저장하지 않고 닫을까요?")) return;
    close();
  }, [close, dirty]);
  const complete = useCallback((message: string) => { close(); toast.success(message); router.refresh(); }, [close, router]);
  const openCreate = () => { setEditing(undefined); setDirty(false); setOpen(true); };

  return <div className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-base font-bold text-slate-900">수입축산물 이력 <span className="ml-1 text-sm font-medium text-slate-500">{product.importLivestockHistories.length}건</span></h3><p className="mt-1 text-sm text-slate-500">핵심 이력을 확인하고 이력번호를 선택해 상세정보와 라벨 출력을 확인할 수 있습니다.</p></div><Button onClick={openCreate}><Plus size={16} />이력 추가</Button></div>
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) requestClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/45" />
        <Dialog.Content onInteractOutside={(event) => { event.preventDefault(); requestClose(); }} onEscapeKeyDown={(event) => { event.preventDefault(); requestClose(); }} className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-2xl focus:outline-none">
          <div className="mb-5"><Dialog.Title className="text-xl font-bold text-slate-900">{editing ? "수입축산물 이력 수정" : "수입축산물 이력 등록"}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-500">{editing ? "기존 이력 정보를 확인하고 수정해 주세요." : "신규 이력 정보를 입력해 주세요."}</Dialog.Description></div>
          <button type="button" onClick={requestClose} className="absolute right-5 top-5 rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="닫기"><X size={19} /></button>
          <HistoryForm key={`${editing?.id ?? "new"}-${open}`} product={product} history={editing} onSuccess={complete} onCancel={requestClose} onDirtyChange={setDirty} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    {product.importLivestockHistories.length === 0 ? (
      <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center"><p className="font-semibold text-slate-700">등록된 수입축산물 이력이 없습니다.</p><p className="mt-1 text-sm text-slate-500">이 제품에 사용할 수입이력을 추가해 주세요.</p><Button className="mt-4" onClick={openCreate}><Plus size={16} />이력 추가</Button></div>
    ) : (
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full min-w-[1050px] text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold text-slate-500"><tr>{["이력번호", "원산지", "해외 작업장/업체", "품목명", "수입일", "소비기한", "상태", "관리"].map((item) => <th key={item} className="whitespace-nowrap px-4 py-3.5">{item}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">{product.importLivestockHistories.map((history) => <tr key={history.id}>
          <td className="whitespace-nowrap px-4 py-4"><Link href={`/products/${encodeURIComponent(product.id)}/histories/${history.id}`} className="font-medium text-blue-700 underline-offset-4 hover:underline">{history.historyNumber || `이력 #${history.id}`}</Link></td>
          <td className="px-4 py-4 text-slate-600">{history.countryOfOrigin || "-"}</td>
          <td className="min-w-[220px] max-w-[300px] px-4 py-4 align-top"><div className="space-y-1.5 text-xs leading-5 text-slate-700">
            <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-2"><span className="text-slate-400">도축장</span><span className="break-words">{history.foreignSlaughterhouse || "-"}</span></div>
            <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-2"><span className="text-slate-400">가공장</span><span className="break-words">{history.foreignProcessingPlant || "-"}</span></div>
            <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-2"><span className="text-slate-400">수출업체</span><span className="break-words">{history.exporterName || "-"}</span></div>
          </div></td>
          <td className="max-w-64 truncate px-4 py-4 text-slate-600" title={history.itemName || undefined}>{history.itemName || "-"}</td>
          <td className="whitespace-nowrap px-4 py-4 text-slate-600">{dateOnly(history.importDate)}</td>
          <td className="whitespace-nowrap px-4 py-4"><div className="space-y-1"><div className="font-medium text-slate-700">{dateOnly(history.expirationDate)}</div><div className="text-xs text-slate-400">도축일 · {dateOnly(history.foreignSlaughterDate)}</div></div></td>
          <td className="px-4 py-4"><span className={history.isActive ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700" : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500"}>{history.isActive ? "사용중" : "미사용"}</span></td>
          <td className="whitespace-nowrap px-4 py-4"><Button size="sm" variant="ghost" onClick={() => { setEditing(history); setDirty(false); setOpen(true); }}>수정</Button></td>
        </tr>)}</tbody>
      </table></div>
    )}
  </div>;
}
