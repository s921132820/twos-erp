"use client";

import { useCallback, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Product } from "@prisma/client";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductForm } from "./product-form";

export function ProductDialog({ product, trigger }: { product?: Product; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const onSuccess = useCallback((message: string) => { setOpen(false); toast.success(message); }, []);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger ?? <Button><Plus size={17} />제품 등록</Button>}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/45" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-2xl focus:outline-none">
          <div className="mb-5"><Dialog.Title className="text-xl font-bold text-slate-900">{product ? "제품 수정" : "제품 등록"}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-500">제품의 기본 정보를 입력해 주세요.</Dialog.Description></div>
          <Dialog.Close className="absolute right-5 top-5 rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="닫기"><X size={19} /></Dialog.Close>
          <ProductForm key={`${product?.id ?? "new"}-${open}`} product={product} onSuccess={onSuccess} onCancel={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
