"use client";

import { startTransition, useActionState, useEffect } from "react";
import type { Product } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createProduct, updateProduct } from "@/app/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialProductFormState, productSchema, type ProductInput } from "@/lib/validations/product";

function FieldError({ messages }: { messages?: string[] }) { return messages?.[0] ? <p className="mt-1 text-xs text-red-600">{messages[0]}</p> : null; }

export function ProductForm({ product, onSuccess, onCancel }: { product?: Product; onSuccess: (message: string) => void; onCancel: () => void }) {
  const action = product ? updateProduct.bind(null, product.id) : createProduct;
  const [state, formAction, pending] = useActionState(action, initialProductFormState);
  const { register, handleSubmit, formState: { errors: clientErrors } } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: product?.code ?? "", name: product?.name ?? "", category: product?.category ?? "",
      unit: product?.unit ?? "", description: product?.description ?? "", isActive: product?.isActive ?? true,
    },
  });
  useEffect(() => { if (state.status === "success") onSuccess(state.message); }, [state, onSuccess]);

  const submit = handleSubmit((_values, event) => {
    const form = event?.currentTarget;
    if (form instanceof HTMLFormElement) startTransition(() => formAction(new FormData(form)));
  });

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {state.status === "error" && <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.message}</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">품목코드 <span className="text-red-500">*</span><Input {...register("code")} className="mt-1.5" maxLength={50} /><FieldError messages={state.errors?.code ?? (clientErrors.code?.message ? [clientErrors.code.message] : undefined)} /></label>
        <label className="text-sm font-medium text-slate-700">품목명 <span className="text-red-500">*</span><Input {...register("name")} className="mt-1.5" maxLength={150} /><FieldError messages={state.errors?.name ?? (clientErrors.name?.message ? [clientErrors.name.message] : undefined)} /></label>
        <label className="text-sm font-medium text-slate-700">카테고리 <span className="text-red-500">*</span><Input {...register("category")} className="mt-1.5" maxLength={80} /><FieldError messages={state.errors?.category ?? (clientErrors.category?.message ? [clientErrors.category.message] : undefined)} /></label>
        <label className="text-sm font-medium text-slate-700">판매단위 <span className="text-red-500">*</span><Input {...register("unit")} className="mt-1.5" maxLength={30} /><FieldError messages={state.errors?.unit ?? (clientErrors.unit?.message ? [clientErrors.unit.message] : undefined)} /></label>
      </div>
      <label className="block text-sm font-medium text-slate-700">설명<textarea {...register("description")} maxLength={2000} rows={4} className="mt-1.5 w-full resize-y rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><FieldError messages={state.errors?.description ?? (clientErrors.description?.message ? [clientErrors.description.message] : undefined)} /></label>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" {...register("isActive")} className="h-4 w-4 rounded border-slate-300 accent-blue-600" />사용 중인 제품</label>
      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><Button type="button" variant="outline" onClick={onCancel}>취소</Button><Button type="submit" disabled={pending}>{pending ? "저장 중..." : product ? "수정 저장" : "제품 등록"}</Button></div>
    </form>
  );
}
