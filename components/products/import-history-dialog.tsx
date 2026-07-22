"use client";

import { startTransition, useActionState, useEffect, useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { ImportLivestockHistory, Prisma } from "@prisma/client";
import { ClipboardList, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { createImportHistory, deleteImportHistory, updateImportHistory } from "@/app/products/import-history-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialImportHistoryFormState } from "@/lib/validations/import-livestock-history";

export type ProductWithImportHistories = Prisma.ProductGetPayload<{ include: { importLivestockHistories: true } }>;

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.[0] ? <p className="mt-1 text-xs text-red-600">{messages[0]}</p> : null;
}

function HistoryForm({ productId, history, onSuccess, onCancel }: { productId: string; history?: ImportLivestockHistory; onSuccess: (message: string) => void; onCancel: () => void }) {
  const action = history ? updateImportHistory.bind(null, history.id) : createImportHistory;
  const [state, formAction, pending] = useActionState(action, initialImportHistoryFormState);
  useEffect(() => { if (state.status === "success") onSuccess(state.message); }, [state, onSuccess]);

  return <form action={(formData) => startTransition(() => formAction(formData))} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
    <input type="hidden" name="productId" value={productId} />
    {state.status === "error" && <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.message}</div>}
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-medium text-slate-700">수입축산물 이력번호 <span className="text-red-500">*</span><Input name="historyNumber" defaultValue={history?.historyNumber} maxLength={50} className="mt-1.5" /><FieldError messages={state.errors?.historyNumber} /></label>
      <label className="text-sm font-medium text-slate-700">수입일자 <span className="text-red-500">*</span><Input type="date" name="importDate" defaultValue={history?.importDate.toISOString().slice(0, 10)} className="mt-1.5" /><FieldError messages={state.errors?.importDate} /></label>
      <label className="text-sm font-medium text-slate-700">원산지 <span className="text-red-500">*</span><Input name="countryOfOrigin" defaultValue={history?.countryOfOrigin} maxLength={100} className="mt-1.5" /><FieldError messages={state.errors?.countryOfOrigin} /></label>
      <label className="text-sm font-medium text-slate-700">공급처 <span className="text-red-500">*</span><Input name="supplierName" defaultValue={history?.supplierName} maxLength={150} className="mt-1.5" /><FieldError messages={state.errors?.supplierName} /></label>
    </div>
    <label className="block text-sm font-medium text-slate-700">비고<textarea name="memo" defaultValue={history?.memo ?? ""} maxLength={2000} rows={3} className="mt-1.5 w-full resize-y rounded-md border border-slate-300 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><FieldError messages={state.errors?.memo} /></label>
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" name="isActive" defaultChecked={history?.isActive ?? true} className="h-4 w-4 accent-blue-600" />사용 중인 이력</label>
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>취소</Button><Button type="submit" disabled={pending}>{pending ? "저장 중..." : history ? "수정 저장" : "이력 등록"}</Button></div>
  </form>;
}

export function ImportHistoryDialog({ product }: { product: ProductWithImportHistories }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ImportLivestockHistory>();
  const [showForm, setShowForm] = useState(false);
  const [deleting, startDelete] = useTransition();
  const complete = (message: string) => { toast.success(message); setEditing(undefined); setShowForm(false); };
  const remove = (history: ImportLivestockHistory) => {
    if (!window.confirm(`‘${history.historyNumber}’ 이력을 삭제할까요?`)) return;
    startDelete(async () => {
      const result = await deleteImportHistory(history.id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  };

  return <Dialog.Root open={open} onOpenChange={(next) => { setOpen(next); if (!next) { setShowForm(false); setEditing(undefined); } }}>
    <Dialog.Trigger asChild><Button size="sm" variant="outline"><ClipboardList size={14} />수입이력 {product.importLivestockHistories.length}</Button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/45" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-2xl focus:outline-none">
      <div className="mb-5 flex items-start justify-between gap-4"><div><Dialog.Title className="text-xl font-bold text-slate-900">수입축산물 이력 관리</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-500">{product.name} · 품목보고번호 {product.code}</Dialog.Description></div>{!showForm && <Button onClick={() => setShowForm(true)}><Plus size={16} />새 이력 등록</Button>}</div>
      <Dialog.Close className="absolute right-5 top-5 rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="닫기"><X size={19} /></Dialog.Close>
      {showForm && <div className="mb-5"><HistoryForm key={editing?.id ?? "new"} productId={product.id} history={editing} onSuccess={complete} onCancel={() => { setShowForm(false); setEditing(undefined); }} /></div>}
      {product.importLivestockHistories.length === 0 ? <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">등록된 수입축산물 이력이 없습니다.</div> : <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold text-slate-500"><tr>{["이력번호", "수입일자", "원산지", "공급처", "상태", "관리"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{product.importLivestockHistories.map((history) => <tr key={history.id}><td className="px-4 py-3 font-semibold text-slate-900">{history.historyNumber}</td><td className="px-4 py-3 text-slate-600">{new Intl.DateTimeFormat("ko-KR").format(history.importDate)}</td><td className="px-4 py-3 text-slate-600">{history.countryOfOrigin}</td><td className="px-4 py-3 text-slate-600">{history.supplierName}</td><td className="px-4 py-3"><span className={history.isActive ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700" : "rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500"}>{history.isActive ? "사용" : "미사용"}</span></td><td className="px-4 py-3 whitespace-nowrap"><Button size="sm" variant="ghost" onClick={() => { setEditing(history); setShowForm(true); }}>수정</Button><Button size="sm" variant="ghost" className="text-red-600" disabled={deleting} onClick={() => remove(history)}>삭제</Button></td></tr>)}</tbody></table></div>}
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
