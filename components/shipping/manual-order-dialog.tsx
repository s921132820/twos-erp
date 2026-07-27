"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ManualShippingForm as ManualForm } from "@/lib/shipping/types";
import { ManualShippingForm } from "./manual-shipping-form";

export type ManualOrderDialogMode = "create" | "edit";

export function ManualOrderDialog({ open, mode, initialValues, onOpenChange, onSubmit }: { open: boolean; mode: ManualOrderDialogMode; initialValues: ManualForm; onOpenChange: (open: boolean) => void; onSubmit: (form: ManualForm) => boolean }) {
  const title = mode === "create" ? "수동 주문 추가" : "수동 주문 수정";
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/45" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-2xl focus:outline-none">
    <Dialog.Title className="text-xl font-bold text-slate-900">{title}</Dialog.Title><Dialog.Description className="mb-5 mt-1 text-sm text-slate-500">거래처 정보를 불러오거나 배송 정보를 직접 입력해 주세요.</Dialog.Description>
    <Dialog.Close className="absolute right-5 top-5 rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="닫기"><X size={19} /></Dialog.Close>
    <ManualShippingForm initialValues={initialValues} submitLabel={mode === "create" ? "수동 주문 추가" : "수정 완료"} onSubmit={onSubmit} onCancel={() => onOpenChange(false)} />
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
