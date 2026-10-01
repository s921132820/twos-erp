"use client";

import { useRef, useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteImportHistory } from "@/app/products/import-history-actions";
import { Button } from "@/components/ui/button";

export function DeleteImportHistoryButton({ id, historyNumber, itemName }: { id: number; historyNumber: string | null; itemName: string | null }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const inFlight = useRef(false);
  const router = useRouter();
  const remove = () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setError("");
    startTransition(async () => {
      try {
        const result = await deleteImportHistory(id);
        if (!result.success) {
          setError(result.message);
          toast.error(result.message);
          return;
        }
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } catch {
        const message = "수입축산물 이력을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.";
        setError(message);
        toast.error(message);
      } finally {
        inFlight.current = false;
      }
    });
  };

  return <Dialog.Root open={open} onOpenChange={(nextOpen) => {
    if (inFlight.current) return;
    setError("");
    setOpen(nextOpen);
  }}>
    <Dialog.Trigger asChild><Button type="button" size="sm" variant="ghost" disabled={pending}><Trash2 size={14} />삭제</Button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/45" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl">
        <Dialog.Title className="text-lg font-bold">수입축산물 이력을 삭제하시겠습니까?</Dialog.Title>
        <Dialog.Description className="mt-2 break-words text-sm leading-6 text-slate-600">
          이력번호: {historyNumber || `미등록 (이력 #${id})`}<br />
          {itemName && <>품목명: {itemName}<br /></>}
          삭제한 이력은 복구할 수 없습니다.
        </Dialog.Description>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Dialog.Close asChild><Button type="button" variant="outline" disabled={pending}>취소</Button></Dialog.Close>
          <Button type="button" variant="danger" disabled={pending} onClick={remove}>{pending ? "삭제 중..." : "삭제"}</Button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
