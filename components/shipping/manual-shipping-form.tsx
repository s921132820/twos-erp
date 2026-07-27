"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_DELIVERY_MESSAGE } from "@/lib/shipping/constants";
import type { ManualShippingForm as ManualForm, ShippingClientSearchResult } from "@/lib/shipping/types";

type Props = { initialValues: ManualForm; submitLabel: string; onSubmit: (form: ManualForm) => boolean; onCancel: () => void };

export function ManualShippingForm({ initialValues, submitLabel, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState(initialValues);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ShippingClientSearchResult[]>([]);
  const [searchError, setSearchError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const requestNumber = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const currentRequest = ++requestNumber.current;
    const timer = window.setTimeout(async () => {
      setLoading(true); setSearchError("");
      try {
        const response = await fetch(`/api/shipping/clients?q=${encodeURIComponent(trimmed.slice(0, 100))}`, { signal: controller.signal });
        const payload = await response.json() as { success: boolean; data?: ShippingClientSearchResult[]; message?: string };
        if (currentRequest !== requestNumber.current) return;
        if (!response.ok || !payload.success) throw new Error(payload.message);
        setResults(payload.data ?? []);
      } catch (error) {
        if (controller.signal.aborted || currentRequest !== requestNumber.current) return;
        setResults([]); setSearchError(error instanceof Error && error.message ? error.message : "거래처 정보를 불러오지 못했습니다. 직접 입력은 계속 사용할 수 있습니다.");
      } finally { if (currentRequest === requestNumber.current) setLoading(false); }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  const update = <K extends keyof ManualForm>(key: K, value: ManualForm[K]) => { setSubmitError(""); setForm((previous) => ({ ...previous, [key]: value })); };
  const selectClient = (client: ShippingClientSearchResult) => {
    const mobile = client.mobilePhone || client.phone || ""; const phone = client.phone || client.mobilePhone || "";
    setForm((previous) => ({ ...previous, selectedClientId: client.id, receiverName: client.consigneeName || previous.receiverName, postalCode: client.postalCode || "", address: client.address || "", phone, mobilePhone: mobile, productName: client.primaryProduct || "", deliveryMessage: client.deliveryMessage?.trim() || DEFAULT_DELIVERY_MESSAGE, phoneWasManuallyEdited: Boolean(client.phone) }));
    setQuery(client.companyName); setResults([]); setSearchError("");
  };
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (!onSubmit(form)) setSubmitError("받는 분, 주소, 휴대전화, 물품명 중 하나 이상을 입력해 주세요."); };

  return <form id="manual-shipping-form" onSubmit={submit}>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="relative sm:col-span-2"><FieldLabel htmlFor="manual-client-search">거래처 검색</FieldLabel><Search className="absolute left-3 top-9 text-slate-400" size={16} /><Input id="manual-client-search" autoFocus value={query} onChange={(event) => { const value = event.target.value; setQuery(value); if (value.trim().length < 2) { requestNumber.current += 1; setResults([]); setSearchError(""); setLoading(false); } }} placeholder="회사명, 수취인, 연락처, 주소 검색 (2자 이상)" className="pl-9" />
        {(results.length > 0 || searchError || loading) && <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg">{loading && <p className="p-2 text-xs text-slate-500">거래처 검색 중...</p>}{searchError && <p className="p-2 text-xs text-amber-700">{searchError}</p>}{results.map((client) => <button type="button" key={client.id} onClick={() => selectClient(client)} className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-50"><span className="font-semibold">{client.companyName}</span><span className="ml-2 text-slate-500">{client.consigneeName} · {client.mobilePhone || client.phone || "연락처 없음"}</span></button>)}</div>}
      </div>
      <Field id="manual-receiver" label="받는 분" invalid={Boolean(submitError)}><Input id="manual-receiver" aria-invalid={Boolean(submitError)} aria-describedby={submitError ? "manual-form-error" : undefined} value={form.receiverName} onChange={(e) => update("receiverName", e.target.value)} /></Field>
      <Field id="manual-postal" label="우편번호"><Input id="manual-postal" value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} /></Field>
      <Field id="manual-address" label="주소" className="sm:col-span-2" invalid={Boolean(submitError)}><Input id="manual-address" aria-invalid={Boolean(submitError)} aria-describedby={submitError ? "manual-form-error" : undefined} value={form.address} onChange={(e) => update("address", e.target.value)} /></Field>
      <Field id="manual-mobile" label="휴대전화" invalid={Boolean(submitError)}><Input id="manual-mobile" aria-invalid={Boolean(submitError)} aria-describedby={submitError ? "manual-form-error" : undefined} value={form.mobilePhone} onChange={(e) => { setSubmitError(""); setForm((p) => ({ ...p, mobilePhone: e.target.value, phone: p.phoneWasManuallyEdited ? p.phone : e.target.value })); }} /></Field>
      <Field id="manual-phone" label="전화번호"><Input id="manual-phone" value={form.phone} onChange={(e) => { setSubmitError(""); setForm((p) => ({ ...p, phone: e.target.value, phoneWasManuallyEdited: true })); }} /></Field>
      <Field id="manual-product" label="물품명" className="sm:col-span-2" invalid={Boolean(submitError)}><Input id="manual-product" aria-invalid={Boolean(submitError)} aria-describedby={submitError ? "manual-form-error" : undefined} value={form.productName} onChange={(e) => update("productName", e.target.value)} /></Field>
      <Field id="manual-quantity" label="택배수량"><Input id="manual-quantity" type="number" min={1} step={1} value={form.packageQuantity} onChange={(e) => update("packageQuantity", Number(e.target.value))} /></Field>
      <Field id="manual-fare" label="택배운임구분"><Input id="manual-fare" value={form.shippingFareType} onChange={(e) => update("shippingFareType", e.target.value)} placeholder="예: 선불" /></Field>
      <Field id="manual-message" label="배송메시지" className="sm:col-span-2"><Input id="manual-message" value={form.deliveryMessage} onChange={(e) => update("deliveryMessage", e.target.value)} /></Field>
    </div>
    {submitError && <p id="manual-form-error" role="alert" className="mt-3 text-sm text-red-600">{submitError}</p>}
    <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>취소</Button><Button type="submit">{submitLabel}</Button></div>
  </form>;
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) { return <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold text-slate-600">{children}</label>; }
function Field({ id, label, className = "", invalid, children }: { id: string; label: string; className?: string; invalid?: boolean; children: React.ReactNode }) { return <div className={className}><FieldLabel htmlFor={id}>{label}</FieldLabel>{children}{invalid && <span className="sr-only">입력값을 확인해 주세요.</span>}</div>; }
