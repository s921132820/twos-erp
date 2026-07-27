"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_DELIVERY_MESSAGE } from "@/lib/shipping/constants";
import { createInitialManualForm } from "@/lib/shipping/manual-shipping";
import type { ManualShippingForm, ShippingClientSearchResult } from "@/lib/shipping/types";

export function ManualShippingEntry({ onAdd }: { onAdd: (form: ManualShippingForm) => boolean }) {
  const [form, setForm] = useState(createInitialManualForm);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ShippingClientSearchResult[]>([]);
  const [searchError, setSearchError] = useState("");
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
        setResults([]); setSearchError(error instanceof Error && error.message ? error.message : "거래처 검색에 실패했습니다. 직접 입력해 주세요.");
      } finally { if (currentRequest === requestNumber.current) setLoading(false); }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  const update = <K extends keyof ManualShippingForm>(key: K, value: ManualShippingForm[K]) => setForm((previous) => ({ ...previous, [key]: value }));
  const selectClient = (client: ShippingClientSearchResult) => {
    const mobile = client.mobilePhone || client.phone || "";
    const phone = client.phone || client.mobilePhone || "";
    setForm((previous) => ({ ...previous, selectedClientId: client.id, receiverName: client.consigneeName || previous.receiverName, postalCode: client.postalCode || "", address: client.address || "", phone, mobilePhone: mobile, productName: client.primaryProduct || "", deliveryMessage: client.deliveryMessage?.trim() || DEFAULT_DELIVERY_MESSAGE, phoneWasManuallyEdited: Boolean(client.phone) }));
    setQuery(client.companyName); setResults([]); setSearchError("");
  };
  const submit = () => { if (onAdd(form)) { setForm(createInitialManualForm()); setQuery(""); setResults([]); setSearchError(""); } };

  return <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-bold text-slate-900">수동 배송 입력</h3><p className="text-xs text-slate-500">거래처를 찾아 자동 입력하거나 아래 항목을 직접 작성하세요.</p></div></div>
    <div className="relative mb-3 max-w-xl"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><Input value={query} onChange={(event) => { const value = event.target.value; setQuery(value); if (value.trim().length < 2) { requestNumber.current += 1; setResults([]); setSearchError(""); setLoading(false); } }} placeholder="거래처명, 수취인, 연락처, 주소 검색 (2자 이상)" className="pl-9" />
      {(results.length > 0 || searchError || loading) && <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg">{loading && <p className="p-2 text-xs text-slate-500">검색 중...</p>}{searchError && <p className="p-2 text-xs text-amber-700">{searchError}</p>}{results.map((client) => <button type="button" key={client.id} onClick={() => selectClient(client)} className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-50"><span className="font-semibold">{client.companyName}</span><span className="ml-2 text-slate-500">{client.consigneeName} · {client.mobilePhone || client.phone || "연락처 없음"}</span></button>)}</div>}
    </div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      <Field label="받는 분 *"><Input value={form.receiverName} onChange={(e) => update("receiverName", e.target.value)} /></Field>
      <Field label="우편번호"><Input value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} /></Field>
      <Field label="주소 *" className="lg:col-span-2"><Input value={form.address} onChange={(e) => update("address", e.target.value)} /></Field>
      <Field label="휴대전화 *"><Input value={form.mobilePhone} onChange={(e) => setForm((p) => ({ ...p, mobilePhone: e.target.value, phone: p.phoneWasManuallyEdited ? p.phone : e.target.value }))} /></Field>
      <Field label="전화번호"><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value, phoneWasManuallyEdited: true }))} /></Field>
      <Field label="택배수량"><Input type="number" min={1} step={1} value={form.packageQuantity} onChange={(e) => update("packageQuantity", Number(e.target.value))} /></Field>
      <Field label="물품명 *" className="lg:col-span-2"><Input value={form.productName} onChange={(e) => update("productName", e.target.value)} /></Field>
      <Field label="택배운임구분"><Input value={form.shippingFareType} onChange={(e) => update("shippingFareType", e.target.value)} placeholder="예: 선불" /></Field>
      <Field label="배송메시지" className="sm:col-span-2 lg:col-span-4"><Input value={form.deliveryMessage} onChange={(e) => update("deliveryMessage", e.target.value)} /></Field>
      <div className="flex items-end"><Button type="button" className="w-full" onClick={submit}><Plus size={16} />수동 주문 추가</Button></div>
    </div>
  </section>;
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) { return <label className={className}><span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>{children}</label>; }
