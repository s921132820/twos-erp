"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeEditableShippingRow } from "@/lib/shipping/manual-shipping";
import type { ConvertedShippingRow, HanjinShippingRow } from "@/lib/shipping/types";

const editableFields: { key: keyof HanjinShippingRow; label: string; type?: string; wide?: boolean }[] = [
  { key: "receiverName", label: "받는 분" }, { key: "postalCode", label: "우편번호" }, { key: "address", label: "주소", wide: true },
  { key: "phone", label: "전화번호" }, { key: "mobilePhone", label: "휴대전화" }, { key: "packageQuantity", label: "택배수량", type: "number" },
  { key: "productName", label: "물품명", wide: true }, { key: "deliveryMessage", label: "배송메시지", wide: true }, { key: "shippingFareType", label: "택배운임구분" },
];

export function ShippingRowEditDialog({ row, onClose, onSave }: { row: ConvertedShippingRow | null; onClose: () => void; onSave: (row: HanjinShippingRow) => void }) {
  if (!row) return null;
  return <ShippingRowEditor key={row.rowKey} row={row} onClose={onClose} onSave={onSave} />;
}

function ShippingRowEditor({ row, onClose, onSave }: { row: ConvertedShippingRow; onClose: () => void; onSave: (row: HanjinShippingRow) => void }) {
  const [draft, setDraft] = useState<HanjinShippingRow>(row);
  return <Dialog.Root open={Boolean(row)} onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/45" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-2xl focus:outline-none">
      <Dialog.Title className="text-xl font-bold text-slate-900">배송 정보 수정</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-500">수정 내용은 현재 통합 작업에만 적용됩니다.</Dialog.Description>
      <Dialog.Close className="absolute right-5 top-5 rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="닫기"><X size={19} /></Dialog.Close>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{editableFields.map(({ key, label, type, wide }) => <label key={key} className={wide ? "sm:col-span-2" : ""}><span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span><Input type={type} min={type === "number" ? 1 : undefined} value={draft[key]} onChange={(event) => setDraft((previous) => previous ? { ...previous, [key]: key === "packageQuantity" ? Number(event.target.value) : event.target.value } : previous)} /></label>)}</div>
      <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>취소</Button><Button type="button" onClick={() => { onSave(normalizeEditableShippingRow(draft)); onClose(); }}>저장</Button></div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
