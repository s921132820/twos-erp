"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createClient, updateClient } from "@/app/clients/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clientSchema, initialClientFormState, type ClientInput } from "@/lib/validations/client";

function ErrorText({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
}

export function ClientForm({ client }: { client?: Client }) {
  const router = useRouter();
  const formAction = client ? updateClient.bind(null, client.id) : createClient;
  const [state, action, pending] = useActionState(formAction, initialClientFormState);
  const { register, handleSubmit, formState: { errors } } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      companyName: client?.companyName ?? "", consigneeName: client?.consigneeName ?? "",
      postalCode: client?.postalCode ?? "", address: client?.address ?? "",
      telephone: client?.telephone ?? "", mobilePhone: client?.mobilePhone ?? "",
      mainProduct: client?.mainProduct ?? "", deliveryMessage: client?.deliveryMessage ?? "",
      memo: client?.memo ?? "",
    },
  });
  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      const clientId = state.clientId ?? client?.id;
      router.push(clientId ? `/clients/${encodeURIComponent(clientId)}` : "/clients");
      router.refresh();
    }
  }, [state, router, client?.id]);
  const submit = handleSubmit((data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.set(key, value ?? ""));
    startTransition(() => action(formData));
  });
  const fields: Array<{ key: keyof ClientInput; label: string; max: number }> = [
    { key: "companyName", label: "거래처명", max: 100 }, { key: "consigneeName", label: "수화인명", max: 100 },
    { key: "postalCode", label: "우편번호", max: 10 }, { key: "telephone", label: "전화번호", max: 20 },
    { key: "mobilePhone", label: "핸드폰 번호", max: 20 }, { key: "mainProduct", label: "물품명", max: 255 },
  ];
  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
      {state.status === "error" && <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.message}</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, max }) => <label key={key} className="text-sm font-medium text-slate-700">{label}{(key === "companyName" || key === "consigneeName") && <span className="text-red-500"> *</span>}<Input {...register(key)} maxLength={max} className="mt-1.5" /><ErrorText message={state.errors?.[key]?.[0] ?? errors[key]?.message} /></label>)}
      </div>
      <label className="block text-sm font-medium text-slate-700">주소 <span className="text-red-500">*</span><textarea {...register("address")} maxLength={255} rows={3} className="mt-1.5 w-full rounded-md border border-slate-300 p-3 text-sm" /><ErrorText message={state.errors?.address?.[0] ?? errors.address?.message} /></label>
      <label className="block text-sm font-medium text-slate-700">배송 메시지<textarea {...register("deliveryMessage")} maxLength={500} rows={3} className="mt-1.5 w-full rounded-md border border-slate-300 p-3 text-sm" /><ErrorText message={state.errors?.deliveryMessage?.[0] ?? errors.deliveryMessage?.message} /></label>
      <label className="block text-sm font-medium text-slate-700">메모<textarea {...register("memo")} maxLength={10000} rows={5} className="mt-1.5 w-full rounded-md border border-slate-300 p-3 text-sm" /><ErrorText message={state.errors?.memo?.[0] ?? errors.memo?.message} /></label>
      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><Button type="button" variant="outline" onClick={() => router.back()}>취소</Button><Button type="submit" disabled={pending}>{pending ? "저장 중..." : client ? "수정 저장" : "거래처 등록"}</Button></div>
    </form>
  );
}
