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
      code: product?.code ?? "", unit: product?.unit ?? "",
      description: product?.description ?? "", name: product?.name ?? "", category: product?.category ?? "",
      material: product?.material ?? "",
    },
  });
  useEffect(() => { if (state.status === "success") onSuccess(state.message); }, [state, onSuccess]);

  const submit = handleSubmit((values) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      formData.set(key, value ?? "");
    }
    startTransition(() => formAction(formData));
  });

  return (
    <form onSubmit={submit} className="space-y-5" noValidate aria-busy={pending}>
      {state.status === "error" && <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.message}</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">품목보고번호 <span className="text-red-500">*</span><Input {...register("code")} className="mt-1.5" maxLength={20} /><FieldError messages={state.errors?.code ?? (clientErrors.code?.message ? [clientErrors.code.message] : undefined)} /></label>
        <label className="text-sm font-medium text-slate-700">제품명 <span className="text-red-500">*</span><Input {...register("name")} className="mt-1.5" maxLength={100} /><FieldError messages={state.errors?.name ?? (clientErrors.name?.message ? [clientErrors.name.message] : undefined)} /></label>
        <label className="text-sm font-medium text-slate-700">카테고리 <span className="text-red-500">*</span><Input {...register("category")} className="mt-1.5" maxLength={50} /><FieldError messages={state.errors?.category ?? (clientErrors.category?.message ? [clientErrors.category.message] : undefined)} /></label>
        <label className="text-sm font-medium text-slate-700">제품유형 <span className="text-red-500">*</span><Input {...register("unit")} className="mt-1.5" maxLength={50} /><FieldError messages={state.errors?.unit ?? (clientErrors.unit?.message ? [clientErrors.unit.message] : undefined)} /></label>
        <label className="text-sm font-medium text-slate-700">소비기한 <span className="text-red-500">*</span><Input {...register("description")} className="mt-1.5" maxLength={100} /><FieldError messages={state.errors?.description ?? (clientErrors.description?.message ? [clientErrors.description.message] : undefined)} /></label>
      </div>
      <label className="block text-sm font-medium text-slate-700">원료 및 함량<textarea {...register("material")} rows={5} maxLength={5000} placeholder="원료명과 함량을 입력해 주세요. 여러 줄로 입력할 수 있습니다." className="mt-1.5 w-full resize-y rounded-md border border-slate-300 bg-white p-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><FieldError messages={state.errors?.material ?? (clientErrors.material?.message ? [clientErrors.material.message] : undefined)} /></label>
      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><Button type="button" variant="outline" onClick={onCancel}>취소</Button><Button type="submit" disabled={pending}>{pending ? "저장 중..." : product ? "수정 저장" : "제품 등록"}</Button></div>
    </form>
  );
}
