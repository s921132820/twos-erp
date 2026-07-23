"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { AlertTriangle, PackageSearch, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type LabelProduct = {
  id: string;
  name: string;
  code: string;
  material: string | null;
  activeHistoryCount: number;
  activeHistory: null | {
    id: number;
    historyNumber: string;
    countryOfOrigin: string;
    foreignSlaughterDate: string | null;
  };
};

type Tab = "box" | "vacuum" | "meatbox";
const tabs: Array<{ id: Tab; label: string }> = [
  { id: "box", label: "박스라벨(20kg)" },
  { id: "vacuum", label: "진공라벨" },
  { id: "meatbox", label: "미트박스 입고 라벨" },
];

function dateInSeoul() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function addMonths(dateText: string | null, months: number) {
  if (!dateText) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
  if (!match) return "";
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const targetMonth = month + months;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  return `${targetYear}-${String(normalizedMonth + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

function shortDate(value: string) {
  return value ? value.slice(2).replaceAll("-", ".") : "";
}

function Barcode({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    JsBarcode(ref.current, value, {
      format: "CODE128",
      width: 1.6,
      height: 42,
      displayValue: true,
      fontSize: 14,
      textMargin: 2,
      margin: 0,
      background: "transparent",
    });
  }, [value]);
  return value ? <svg ref={ref} aria-label={`수입이력번호 바코드 ${value}`} className="label-barcode" /> : <div className="label-barcode-empty">수입이력번호 없음</div>;
}

function BoxLabel({ product, today }: { product: LabelProduct | null; today: string }) {
  const history = product?.activeHistory;
  const expirationDate = addMonths(history?.foreignSlaughterDate ?? null, 24);

  return (
    <article className="print-label" aria-label="박스라벨 20kg 미리보기">
      <div className="label-top-grid">
        <div className="label-product-name">{product?.name || "제품명"}</div>
        <div className="label-storage">냉동</div>
        <div className="label-weight">20 kg</div>
        <div className="label-meta">
          <strong>{history?.countryOfOrigin || "원산지"}</strong>
          <span>{shortDate(today)}</span>
          <span>{expirationDate ? `${shortDate(expirationDate)}까지` : "유통기한"}</span>
        </div>
      </div>
      <div className="label-report-number">{product?.code || "품목보고번호"}</div>
      <Barcode value={history?.historyNumber ?? ""} />
      <div className="label-details">
        <div className="label-material"><b>■ 원료 및 함량:</b><span>{product?.material || ""}</span></div>
        <p><b>■ 제품규격:</b> 20 kg</p>
        <p className="label-packaging">- HDPE<br />- 골판지 / 진공포장</p>
        <p className="label-notice">■ 본 제품은 등록된 제조시설에서 제조하고 있습니다.</p>
      </div>
      <footer className="label-company">
        <p>제조원:<strong>(주)투에스푸드</strong></p>
        <small>경기도 광주시 도척면 도척로 699번길 30-8. TEL:031-8027-2650</small>
      </footer>
    </article>
  );
}

export function LabelPrinterWorkspace() {
  const [tab, setTab] = useState<Tab>("box");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LabelProduct[]>([]);
  const [selected, setSelected] = useState<LabelProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [printing, setPrinting] = useState(false);
  const printInProgress = useRef(false);
  const today = dateInSeoul();

  const printOneLabel = () => {
    if (!selected || printInProgress.current) {
      if (printInProgress.current) console.warn("[label-printer] 중복 인쇄 호출을 차단했습니다.");
      return;
    }

    const label = document.querySelector<HTMLElement>(".label-preview-shell .print-label");
    if (!label) {
      console.error("[label-printer] 인쇄할 라벨을 찾지 못했습니다.");
      return;
    }

    printInProgress.current = true;
    setPrinting(true);
    const jobId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
    console.info("[label-printer] 단일 인쇄 작업 시작", {
      jobId,
      printCalls: 1,
      labels: 1,
      pageSize: "60mm x 80mm",
      productId: selected.id,
    });

    const frame = document.createElement("iframe");
    frame.className = "label-print-frame";
    frame.title = "60mm × 80mm 라벨 인쇄 문서";
    frame.setAttribute("aria-hidden", "true");
    document.body.appendChild(frame);

    let fallbackTimer = 0;
    const finish = () => {
      window.clearTimeout(fallbackTimer);
      frame.remove();
      printInProgress.current = false;
      setPrinting(false);
    };
    let printCalled = false;
    frame.onload = async () => {
      if (printCalled) return;
      printCalled = true;
      const printWindow = frame.contentWindow;
      const printDocument = frame.contentDocument;
      if (!printWindow || !printDocument) {
        finish();
        return;
      }
      await printDocument.fonts?.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      printWindow.addEventListener("afterprint", finish, { once: true });
      fallbackTimer = window.setTimeout(finish, 120_000);
      console.info("[label-printer] iframe window.print 호출", { jobId, printCalls: 1 });
      printWindow.focus();
      printWindow.print();
    };

    const styles = Array.from(document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>('link[rel="stylesheet"], style'))
      .map((element) => element.outerHTML)
      .join("\n");
    frame.srcdoc = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><base href="${document.baseURI}">${styles}<style>
      @page { size: 60mm 80mm; margin: 0; }
      html, body { width: 60mm !important; height: 80mm !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: #fff !important; }
      .print-label { position: static !important; box-sizing: border-box !important; width: 60mm !important; height: 80mm !important; min-width: 60mm !important; min-height: 80mm !important; max-width: 60mm !important; max-height: 80mm !important; margin: 0 !important; border: 0 !important; border-radius: 0 !important; overflow: hidden !important; transform: none !important; break-inside: avoid !important; page-break-inside: avoid !important; page-break-after: avoid !important; }
    </style></head><body>${label.outerHTML}</body></html>`;
  };

  const search = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) {
      setError("검색할 제품명을 입력해 주세요.");
      setResults([]);
      return;
    }
    setLoading(true);
    setError("");
    setSelected(null);
    try {
      const response = await fetch(`/api/label-printer/products?q=${encodeURIComponent(query.trim())}`, { cache: "no-store" });
      const body = await response.json() as { success: boolean; data?: LabelProduct[]; message?: string };
      if (!response.ok || !body.success) throw new Error(body.message || "제품을 조회하지 못했습니다.");
      setResults(body.data ?? []);
      setSearched(true);
    } catch (cause) {
      setResults([]);
      setSearched(true);
      setError(cause instanceof Error ? cause.message : "제품을 조회하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const missing = selected ? [
    !selected.code && "품목보고번호",
    !selected.activeHistory?.historyNumber && "현재 사용 중인 수입이력번호",
    !selected.activeHistory?.countryOfOrigin && "원산지",
    !selected.activeHistory?.foreignSlaughterDate && "도축일",
    !selected.material && "원료 및 함량",
  ].filter(Boolean) as string[] : [];

  return (
    <section className="label-printer-workspace space-y-5">
      <div className="screen-only rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="제품명으로 검색" maxLength={100} className="pl-10" />
          </div>
          <Button type="submit" disabled={loading}><PackageSearch size={17} />{loading ? "검색 중..." : "제품 검색"}</Button>
        </form>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        {searched && !loading && !error && results.length === 0 && <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">검색 결과가 없습니다.</p>}
        {results.length > 0 && <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{results.map((product) => (
          <button key={product.id} type="button" onClick={() => setSelected(product)} className={cn("rounded-lg border p-4 text-left transition-colors", selected?.id === product.id ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50")}>
            <strong className="block text-sm text-slate-900">{product.name}</strong>
            <span className="mt-1 block text-xs text-slate-500">품목보고번호 {product.code || "없음"}</span>
            <span className={cn("mt-2 inline-block rounded-full px-2 py-1 text-xs font-semibold", product.activeHistory ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{product.activeHistory ? `사용 이력 ${product.activeHistory.historyNumber}` : "사용 중인 이력 없음"}</span>
          </button>
        ))}</div>}
      </div>

      <div className="screen-only flex overflow-x-auto border-b border-slate-200" role="tablist">{tabs.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={cn("whitespace-nowrap border-b-2 px-5 py-3 text-sm font-semibold", tab === item.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}>{item.label}</button>)}</div>

      {tab === "box" ? <div className="label-work-area grid gap-5 xl:grid-cols-[minmax(320px,1fr)_440px]">
        <div className="screen-only rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between"><div><h3 className="font-bold text-slate-900">박스라벨(20kg)</h3><p className="mt-1 text-sm text-slate-500">오른쪽 미리보기와 동일한 크기로 출력됩니다.</p></div><Button type="button" onClick={printOneLabel} disabled={!selected || printing}><Printer size={17} />{printing ? "인쇄 창 여는 중..." : "인쇄"}</Button></div>
          {!selected ? <div className="mt-5 rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">제품을 검색한 후 선택해 주세요.</div> : <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-400">제품명</dt><dd className="font-semibold">{selected.name}</dd></div>
            <div><dt className="text-slate-400">품목보고번호</dt><dd className="font-semibold">{selected.code || "-"}</dd></div>
            <div><dt className="text-slate-400">수입이력번호</dt><dd className="font-semibold">{selected.activeHistory?.historyNumber || "-"}</dd></div>
            <div><dt className="text-slate-400">원산지</dt><dd className="font-semibold">{selected.activeHistory?.countryOfOrigin || "-"}</dd></div>
            <div><dt className="text-slate-400">오늘 날짜</dt><dd className="font-semibold">{today}</dd></div>
            <div><dt className="text-slate-400">유통기한</dt><dd className="font-semibold">{addMonths(selected.activeHistory?.foreignSlaughterDate ?? null, 24) || "-"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-400">원료 및 함량</dt><dd className="mt-1 whitespace-pre-wrap font-semibold">{selected.material || "-"}</dd></div>
          </dl>}
          {selected && selected.activeHistoryCount > 1 && <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">활성 이력이 {selected.activeHistoryCount}개여서 가장 최근 수정된 이력을 사용합니다.</p>}
          {missing.length > 0 && <div className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800"><AlertTriangle className="mt-0.5 shrink-0" size={17} /><span>다음 정보가 없어 빈 값으로 표시됩니다: {missing.join(", ")}</span></div>}
        </div>
        <div className="label-preview-shell"><BoxLabel product={selected} today={today} /></div>
      </div> : <div className="screen-only flex min-h-80 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white"><div className="text-center"><Printer className="mx-auto text-slate-300" size={36} /><h3 className="mt-3 font-bold text-slate-700">{tabs.find((item) => item.id === tab)?.label}</h3><p className="mt-1 text-sm text-slate-500">준비 중입니다.</p></div></div>}
    </section>
  );
}
