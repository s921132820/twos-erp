"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { deleteClient } from "@/app/clients/actions";
import { Button } from "@/components/ui/button";

export function DeleteClientButton({ id, name, redirectToList = false }: { id: string; name: string; redirectToList?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const remove = () => startTransition(async () => {
    const result = await deleteClient(id);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    setOpen(false);
    if (redirectToList) router.push("/clients");
    else router.refresh();
  });
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild><Button size="sm" variant="ghost" className="text-red-600">삭제</Button></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/45" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl">
          <Dialog.Title className="text-lg font-bold">거래처를 삭제할까요?</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-slate-600">{name} 거래처를 삭제하면 복구할 수 없습니다.</Dialog.Description>
          <div className="mt-6 flex justify-end gap-2"><Dialog.Close asChild><Button variant="outline">취소</Button></Dialog.Close><Button variant="danger" disabled={pending} onClick={remove}>{pending ? "삭제 중..." : "삭제"}</Button></div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
