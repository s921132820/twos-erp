"use client";

import { FormEvent, type MouseEvent, useEffect, useRef, useState } from "react";
import { AlertTriangle, PackageSearch, Printer, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BARCODE_MIN_BARS_HEIGHT, createBoxLabelTspl, minimumBarcodeHeight, renderBoxLabelCanvas, type BoxLabelPrintData } from "@/lib/printing/box-label-tspl";
import { cloneLabelPrintConfig, dotsToMm, LABEL_PRINT_CONFIGS, mmToDots, normalizeLabelPrintConfig, type LabelFieldKey, type LabelPrintConfig } from "@/lib/printing/label-print-config";
import { listQzPrinters, printTspl } from "@/lib/printing/qz-client";
import { cn } from "@/lib/utils";

type ActiveHistory = {
  id: number;
  historyNumber: string | null;
  countryOfOrigin: string | null;
  foreignSlaughterDate: string | null;
};

type LabelProduct = {
  id: string;
  name: string;
  code: string;
  material: string | null;
  activeHistories: ActiveHistory[];
};

type LabelSelection = { product: LabelProduct; history: ActiveHistory };

type Tab = "box" | "vacuum" | "meatbox";
const tabs: Array<{ id: Tab; label: string }> = [
  { id: "box", label: "박스라벨(20kg)" },
  { id: "vacuum", label: "진공라벨" },
  { id: "meatbox", label: "미트박스 입고 라벨" },
];

const FIELD_LABELS: Record<LabelFieldKey, string> = {
  productName: "제품명",
  frozenText: "냉동",
  weight: "중량",
  weightUnit: "중량 단위",
  productSpec: "제품규격",
  reportNumber: "품목보고번호",
  importHistoryNumber: "수입이력번호",
  origin: "원산지",
  today: "오늘 날짜",
  expiryDate: "유통기한",
  material: "원료 및 함량",
  materialLabel: "원료 및 함량 제목",
  storageMethod: "보관방법",
  foodType: "식품의 유형",
  packagingMaterial: "포장재질",
  notice: "주의사항",
  barcodeNumber: "바코드 번호",
  manufacturer: "제조원",
  manufacturerAddress: "제조원 주소",
  manufacturerPhone: "전화번호",
};
const FIELD_KEYS = Object.keys(FIELD_LABELS) as LabelFieldKey[];
const FIELD_DATA_KEYS: Record<LabelFieldKey, keyof BoxLabelPrintData> = {
  productName: "productName", frozenText: "frozenText", weight: "weight", weightUnit: "weightUnit",
  productSpec: "productSpec", reportNumber: "reportNumber", importHistoryNumber: "historyNumber",
  origin: "countryOfOrigin", today: "manufactureDate", expiryDate: "expirationDate",
  material: "material", materialLabel: "materialLabel", storageMethod: "storageMethod",
  foodType: "foodType", packagingMaterial: "packagingMaterial", notice: "notice",
  barcodeNumber: "barcodeNumber", manufacturer: "manufacturer",
  manufacturerAddress: "manufacturerAddress", manufacturerPhone: "manufacturerPhone",
};

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

function defaultLabelData(today: string, product?: LabelProduct, history?: ActiveHistory): BoxLabelPrintData {
  const expirationDate = addMonths(history?.foreignSlaughterDate ?? null, 24);
  return {
    productName: product?.name ?? "",
    frozenText: "냉동",
    weight: "20",
    weightUnit: "kg",
    productSpec: "",
    reportNumber: product?.code ?? "",
    historyNumber: history?.historyNumber ?? "",
    barcodeNumber: history?.historyNumber ?? "",
    countryOfOrigin: history?.countryOfOrigin ?? "",
    manufactureDate: shortDate(today),
    expirationDate: expirationDate ? `${shortDate(expirationDate)}까지` : "",
    material: product?.material ?? "",
    materialLabel: "■원료및함량:",
    storageMethod: "",
    foodType: "",
    packagingMaterial: "- HDPE\n- 골판지 / 진공포장",
    notice: "■ 본 제품은 등록된 제조시설에서 제조하고 있습니다.",
    manufacturer: "제조원: (주)투에스푸드",
    manufacturerAddress: "경기도 광주시 도척면 도척로 699번길 30-8",
    manufacturerPhone: "TEL:031-8027-2650",
  };
}

function downloadFile(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function bitmapHexDump(bitmap: Uint8Array, widthBytes: number) {
  const lines: string[] = [];
  for (let offset = 0; offset < bitmap.length; offset += widthBytes) {
    const row = bitmap.subarray(offset, offset + widthBytes);
    lines.push(`${String(offset / widthBytes).padStart(4, "0")}: ${Array.from(row, (value) => value.toString(16).padStart(2, "0")).join(" ")}`);
  }
  return lines.join("\n");
}

function CanvasPreview({ data, layout, selectedField, onSelectField }: { data: BoxLabelPrintData; layout: LabelPrintConfig; selectedField: LabelFieldKey; onSelectField: (key: LabelFieldKey) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const printRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      renderBoxLabelCanvas(data, layout, { selectedField }),
      renderBoxLabelCanvas(data, layout),
    ]).then(([preview, printable]) => {
      if (cancelled) return;
      ref.current?.getContext("2d")?.drawImage(preview.canvas, 0, 0);
      printRef.current?.getContext("2d")?.drawImage(printable.canvas, 0, 0);
    });
    return () => { cancelled = true; };
  }, [data, layout, selectedField]);
  const selectAtPoint = (event: MouseEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * 480 / bounds.width;
    const y = (event.clientY - bounds.top) * 720 / bounds.height;
    const hit = [...FIELD_KEYS].reverse().find((key) => {
      const field = layout.fields[key];
      const manufacturerField = key === "manufacturer" || key === "manufacturerAddress" || key === "manufacturerPhone";
      const fieldX = field.x + (manufacturerField ? layout.manufacturerGroupOffsetX : layout.contentOffsetX);
      const fieldY = field.y + (manufacturerField ? layout.manufacturerGroupOffsetY : layout.contentOffsetY);
      return x >= fieldX && x <= fieldX + field.width && y >= fieldY && y <= fieldY + field.height;
    });
    if (hit) onSelectField(hit);
  };
  return <>
    <canvas ref={ref} width={480} height={720} onClick={selectAtPoint} className="box-label-canvas box-label-screen-canvas cursor-crosshair" aria-label="박스라벨 20kg 실시간 미리보기" />
    <canvas ref={printRef} width={480} height={720} className="box-label-canvas box-label-print-canvas" aria-label="박스라벨 20kg 인쇄본" />
  </>;
}

export function LabelPrinterWorkspace() {
  const [tab, setTab] = useState<Tab>("box");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LabelProduct[]>([]);
  const [selected, setSelected] = useState<LabelSelection | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [printing, setPrinting] = useState(false);
  const [checkingPrinter, setCheckingPrinter] = useState(false);
  const [savingDebug, setSavingDebug] = useState(false);
  const [printerName, setPrinterName] = useState("TSC MB240");
  const [printers, setPrinters] = useState<string[]>([]);
  const [density, setDensity] = useState(6);
  const [speed, setSpeed] = useState(3);
  const [printConfig, setPrintConfig] = useState<LabelPrintConfig>(() => cloneLabelPrintConfig(LABEL_PRINT_CONFIGS.box20kg));
  const [selectedField, setSelectedField] = useState<LabelFieldKey>("productName");
  const [fieldSearch, setFieldSearch] = useState("");
  const [movementStep, setMovementStep] = useState(1);
  const [labelData, setLabelData] = useState<BoxLabelPrintData>(() => defaultLabelData(dateInSeoul()));
  const [sourceLabelData, setSourceLabelData] = useState<BoxLabelPrintData>(() => defaultLabelData(dateInSeoul()));
  const initialLayoutRef = useRef<LabelPrintConfig>(cloneLabelPrintConfig(LABEL_PRINT_CONFIGS.box20kg));
  const printInProgress = useRef(false);
  const today = dateInSeoul();
  const selectedLayout = printConfig.fields[selectedField];
  const visibleFieldKeys = FIELD_KEYS.filter((key) => FIELD_LABELS[key].toLocaleLowerCase().includes(fieldSearch.trim().toLocaleLowerCase()));

  useEffect(() => {
    const saved = window.localStorage.getItem("twosfood.box20kgLayout.v7");
    if (!saved) return;
    try {
      const savedLayout = normalizeLabelPrintConfig(JSON.parse(saved) as LabelPrintConfig);
      initialLayoutRef.current = cloneLabelPrintConfig(savedLayout);
      queueMicrotask(() => setPrintConfig(cloneLabelPrintConfig(savedLayout)));
    } catch {
      window.localStorage.removeItem("twosfood.box20kgLayout.v7");
      toast.error("저장된 라벨 배치가 손상되어 코드 기본값으로 시작했습니다.");
    }
  }, []);
  const labelWidthDots = mmToDots(printConfig.widthMm, printConfig.dpi);
  const labelHeightDots = mmToDots(printConfig.heightMm, printConfig.dpi);
  const layoutErrors = FIELD_KEYS.flatMap((key) => {
    const field = printConfig.fields[key];
    if (!field.visible) return [];
    const manufacturerField = key === "manufacturer" || key === "manufacturerAddress" || key === "manufacturerPhone";
    const x = field.x + (manufacturerField ? printConfig.manufacturerGroupOffsetX : printConfig.contentOffsetX);
    const y = field.y + (manufacturerField ? printConfig.manufacturerGroupOffsetY : printConfig.contentOffsetY);
    const messages: string[] = [];
    if (x < 0 || y < 0 || x + field.width > labelWidthDots || y + field.height > labelHeightDots) {
      messages.push(`${FIELD_LABELS[key]} 영역이 ${printConfig.widthMm}×${printConfig.heightMm}mm 라벨 경계를 벗어났습니다.`);
    }
    if (key === "barcodeNumber") {
      const requiredHeight = minimumBarcodeHeight();
      if (field.height < requiredHeight) {
        messages.push(`${FIELD_LABELS[key]} 막대 높이는 최소 ${BARCODE_MIN_BARS_HEIGHT}dot여야 합니다.`);
      }
    } else {
      // Canvas lineHeight controls baseline spacing, but only the font glyph is
      // clipped. Requiring a full line box rejects valid single-line fields.
      const minimumTextHeight = field.fontSize + field.paddingY * 2;
      if (field.height < minimumTextHeight) {
        messages.push(`${FIELD_LABELS[key]} 높이는 글자와 상하 여백을 포함해 최소 ${minimumTextHeight}dot여야 합니다.`);
      }
    }
    const value = labelData[FIELD_DATA_KEYS[key]];
    if (key !== "barcodeNumber") {
      const estimatedCapacity = Math.max(1, Math.floor((field.width - field.paddingX * 2) / Math.max(4, field.fontSize * 0.65))) * Math.max(1, field.maxLines ?? 1);
      if (!field.autoFit && value.length > estimatedCapacity) messages.push(`${FIELD_LABELS[key]} 내용이 설정 영역을 초과할 수 있습니다. 자동 축소를 켜거나 영역을 넓혀 주세요.`);
    }
    return messages;
  });

  const selectHistory = (product: LabelProduct, history: ActiveHistory) => {
    const values = defaultLabelData(today, product, history);
    setSelected({ product, history });
    setSourceLabelData(values);
    setLabelData(values);
  };

  const resetSelectedValue = () => {
    const dataKey = FIELD_DATA_KEYS[selectedField];
    setLabelData((current) => ({ ...current, [dataKey]: sourceLabelData[dataKey] }));
  };

  const updateFieldLayout = (patch: Partial<LabelPrintConfig["fields"][LabelFieldKey]>) => {
    setPrintConfig((current) => ({
      ...current,
      fields: {
        ...current.fields,
        [selectedField]: { ...current.fields[selectedField], ...patch },
      },
    }));
  };

  const resetLayout = () => setPrintConfig(cloneLabelPrintConfig(initialLayoutRef.current));
  const saveLayout = () => {
    if (layoutErrors.length) return toast.error(layoutErrors[0]);
    const normalized = normalizeLabelPrintConfig(printConfig);
    window.localStorage.setItem("twosfood.box20kgLayout.v7", JSON.stringify(normalized));
    initialLayoutRef.current = cloneLabelPrintConfig(normalized);
    toast.success("현재 배치를 이 PC의 시작 기본값으로 저장했습니다.");
  };
  const loadLayout = () => {
    try {
      const saved = window.localStorage.getItem("twosfood.box20kgLayout.v7");
      if (!saved) return toast.info("저장된 박스라벨 배치가 없습니다.");
      const savedLayout = normalizeLabelPrintConfig(JSON.parse(saved) as LabelPrintConfig);
      initialLayoutRef.current = cloneLabelPrintConfig(savedLayout);
      setPrintConfig(savedLayout);
      toast.success("마지막 저장 배치를 불러왔습니다.");
    } catch {
      toast.error("저장된 배치 설정을 읽지 못했습니다.");
    }
  };

  const checkPrinter = async () => {
    setCheckingPrinter(true);
    try {
      const found = await listQzPrinters();
      setPrinters(found);
      const matched = found.find((name) => name.toLocaleLowerCase().includes("tsc mb240"));
      if (matched) {
        setPrinterName(matched);
        window.localStorage.setItem("twosfood.labelPrinterName", matched);
        toast.success(`프린터를 확인했습니다: ${matched}`);
      } else {
        toast.warning("연결된 프린터 목록에서 TSC MB240을 찾지 못했습니다.");
      }
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "프린터 연결 확인에 실패했습니다.");
    } finally {
      setCheckingPrinter(false);
    }
  };

  const printOneLabel = async () => {
    if (!selected || printInProgress.current) {
      if (printInProgress.current) console.warn("[label-printer] 중복 인쇄 호출을 차단했습니다.");
      return;
    }
    printInProgress.current = true;
    setPrinting(true);
    const jobId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
    try {
      if (!printerName.trim()) throw new Error("출력할 프린터 이름을 입력해 주세요.");
      const productNameLayout = printConfig.fields.productName;
      const productNameAvailableHeight = productNameLayout.height - productNameLayout.paddingY * 2;
      const productNameLineHeight = Math.max(productNameLayout.fontSize, productNameLayout.lineHeight);
      console.debug("[label-printer] 제품명 세로 배치", {
        dpi: printConfig.dpi,
        label: {
          widthMm: printConfig.widthMm,
          heightMm: printConfig.heightMm,
          widthDots: labelWidthDots,
          heightDots: labelHeightDots,
        },
        productName: {
          y: productNameLayout.y + printConfig.contentOffsetY,
          bottom: productNameLayout.y + printConfig.contentOffsetY + productNameLayout.height,
          height: productNameLayout.height,
          fontSize: productNameLayout.fontSize,
          lineHeight: productNameLayout.lineHeight,
          effectiveLineHeight: productNameLineHeight,
          paddingY: productNameLayout.paddingY,
          availableHeight: productNameAvailableHeight,
          minimumGlyphHeight: productNameLayout.fontSize,
          minimumFieldHeight: productNameLayout.fontSize + productNameLayout.paddingY * 2,
          fittingLineBoxes: Math.floor(productNameAvailableHeight / productNameLineHeight),
        },
        layoutErrors,
      });
      if (layoutErrors.length) throw new Error(layoutErrors[0]);
      window.localStorage.setItem("twosfood.labelPrinterName", printerName.trim());
      const artifacts = await createBoxLabelTspl(labelData, { density, speed }, printConfig);
      console.info("[label-printer] TSPL 단일 전송", { jobId, sends: 1, copies: 1, printerName, density, speed, bytes: artifacts.command.byteLength, productId: selected.product.id, historyId: selected.history.id, ...artifacts.debug, firstBitmapBytes: Array.from(artifacts.bitmap.slice(0, 16), (value) => value.toString(16).padStart(2, "0")).join(" ") });
      await printTspl(printerName.trim(), artifacts.command, `박스라벨-${selected.product.id}-${selected.history.id}-${jobId}`);
      toast.success("TSC MB240 인쇄 대기열에 라벨 1장을 전송했습니다.");
    } catch (cause) {
      console.error("[label-printer] TSPL 출력 실패", cause);
      toast.error(cause instanceof Error ? cause.message : "라벨 출력에 실패했습니다.");
    } finally {
      printInProgress.current = false;
      setPrinting(false);
    }
  };

  const saveDebugArtifacts = async () => {
    if (!selected || savingDebug) return;
    setSavingDebug(true);
    try {
      const artifacts = await createBoxLabelTspl(labelData, { density, speed }, printConfig);
      const png = await new Promise<Blob>((resolve, reject) => artifacts.canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG 생성에 실패했습니다.")), "image/png"));
      const prefix = `box-label-${selected.product.id}-${selected.history.id}`;
      downloadFile(`${prefix}-canvas.png`, png);
      downloadFile(`${prefix}-bitmap.hex.txt`, new Blob([bitmapHexDump(artifacts.bitmap, artifacts.debug.widthBytes)], { type: "text/plain;charset=utf-8" }));
      downloadFile(`${prefix}.tspl`, new Blob([artifacts.command], { type: "application/octet-stream" }));
      downloadFile(`${prefix}-debug.json`, new Blob([JSON.stringify({ ...artifacts.debug, density, speed, firstBitmapBytes: Array.from(artifacts.bitmap.slice(0, 32), (value) => value.toString(16).padStart(2, "0")) }, null, 2)], { type: "application/json;charset=utf-8" }));
      toast.success("Canvas PNG, Bitmap Hex, TSPL Raw와 진단 정보를 저장했습니다.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "디버그 파일 저장에 실패했습니다.");
    } finally {
      setSavingDebug(false);
    }
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
    !selected.product.code && "품목보고번호",
    !selected.history.historyNumber && "현재 사용 중인 수입이력번호",
    !selected.history.countryOfOrigin && "원산지",
    !selected.history.foreignSlaughterDate && "도축일",
    !selected.product.material && "원료 및 함량",
  ].filter(Boolean) as string[] : [];

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
          <div key={product.id} className="rounded-lg border border-slate-200 p-4">
            <strong className="block text-sm text-slate-900">{product.name}</strong>
            <span className="mt-1 block text-xs text-slate-500">품목보고번호 {product.code || "없음"}</span>
            {product.activeHistories.length ? <div className="mt-3 flex flex-col gap-2">{product.activeHistories.map((history) => {
              const isSelected = selected?.product.id === product.id && selected.history.id === history.id;
              return <button key={`${product.id}:${history.id}`} type="button" onClick={() => selectHistory(product, history)} className={cn("rounded-md border px-3 py-2 text-left text-xs font-semibold transition-colors", isSelected ? "border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-100" : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-blue-300")}>사용 이력 {history.historyNumber || "번호 없음"}</button>;
            })}</div> : <span className="mt-2 inline-block rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">사용 중인 이력 없음</span>}
          </div>
        ))}</div>}
      </div>

      <div className="screen-only flex overflow-x-auto border-b border-slate-200" role="tablist">{tabs.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={cn("whitespace-nowrap border-b-2 px-5 py-3 text-sm font-semibold", tab === item.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}>{item.label}</button>)}</div>

      {tab === "box" ? <div className="label-work-area grid gap-5 xl:grid-cols-[minmax(320px,1fr)_440px]">
        <div className="screen-only rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row"><div className="flex-1"><label htmlFor="label-printer-name" className="text-xs font-semibold text-slate-600">QZ Tray 프린터 이름</label><Input id="label-printer-name" list="label-printer-list" value={printerName} onChange={(event) => setPrinterName(event.target.value)} className="mt-1 bg-white" placeholder="예: TSC MB240" /><datalist id="label-printer-list">{printers.map((printer) => <option key={printer} value={printer} />)}</datalist></div><Button type="button" variant="outline" onClick={checkPrinter} disabled={checkingPrinter} className="self-end">{checkingPrinter ? "확인 중..." : "연결 확인"}</Button></div>
            <div className="mt-3 grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-slate-600">인쇄 농도 (0~15)<Input type="number" min={0} max={15} step={1} value={density} onChange={(event) => setDensity(Math.min(15, Math.max(0, Number(event.target.value))))} className="mt-1 bg-white" /></label><label className="text-xs font-semibold text-slate-600">인쇄 속도 (IPS)<Input type="number" min={1} max={10} step={0.5} value={speed} onChange={(event) => setSpeed(Math.min(10, Math.max(1, Number(event.target.value))))} className="mt-1 bg-white" /></label></div>
            <p className="mt-2 text-xs text-slate-500">권장 시작값은 농도 6, 속도 3 IPS입니다. 번지면 농도를 1씩 낮추고, 흐리면 1씩 올려 테스트하세요.</p>
            <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold text-slate-700">필드별 배치 편집 · 203dpi</p><div className="flex flex-wrap gap-2"><button type="button" onClick={resetLayout} className="text-xs font-semibold text-slate-600 hover:underline">초기값 복원</button><button type="button" onClick={loadLayout} className="text-xs font-semibold text-blue-600 hover:underline">마지막 저장값</button><button type="button" onClick={saveLayout} className="text-xs font-semibold text-emerald-700 hover:underline">현재 배치 저장</button></div></div>
              <Input value={fieldSearch} onChange={(event) => setFieldSearch(event.target.value)} placeholder="조정할 필드 검색" className="bg-white" />
              <select value={selectedField} onChange={(event) => setSelectedField(event.target.value as LabelFieldKey)} className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">{visibleFieldKeys.map((key) => <option key={key} value={key}>{FIELD_LABELS[key]}</option>)}</select>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["x", "y", "width", "height", "fontSize", "fontWeight", "lineHeight", "paddingX", "paddingY", "maxLines", "rotation"] as const).map((property) => <label key={property} className="text-xs font-semibold text-slate-600">{property}<Input type="number" step={property === "fontWeight" ? 100 : 1} value={selectedLayout[property] ?? (property === "rotation" ? 0 : 1)} onChange={(event) => updateFieldLayout({ [property]: Number(event.target.value) })} className="mt-1 bg-white" /></label>)}
                <label className="text-xs font-semibold text-slate-600">정렬<select value={selectedLayout.align} onChange={(event) => updateFieldLayout({ align: event.target.value as "left" | "center" | "right" })} className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2"><option value="left">왼쪽</option><option value="center">가운데</option><option value="right">오른쪽</option></select></label>
                <label className="text-xs font-semibold text-slate-600">세로 정렬<select value={selectedLayout.verticalAlign ?? "middle"} onChange={(event) => updateFieldLayout({ verticalAlign: event.target.value as "top" | "middle" | "bottom" })} className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2"><option value="top">위</option><option value="middle">가운데</option><option value="bottom">아래</option></select></label>
                <label className="flex items-end gap-2 pb-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={selectedLayout.autoFit ?? false} onChange={(event) => updateFieldLayout({ autoFit: event.target.checked })} />자동 축소</label>
                <label className="flex items-end gap-2 pb-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={selectedLayout.visible} onChange={(event) => updateFieldLayout({ visible: event.target.checked })} />표시</label>
              </div>
              <div className="flex flex-wrap items-center gap-2"><select value={movementStep} onChange={(event) => setMovementStep(Number(event.target.value))} className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs"><option value={1}>1dot</option><option value={5}>5dot</option><option value={8}>1mm</option></select>{([["←", "x", -1], ["→", "x", 1], ["↑", "y", -1], ["↓", "y", 1]] as const).map(([label, axis, direction]) => <Button key={label} type="button" variant="outline" onClick={() => updateFieldLayout({ [axis]: selectedLayout[axis] + direction * movementStep })} className="h-8 px-3">{label}</Button>)}</div>
              <div className="grid grid-cols-2 gap-2"><label className="text-xs font-semibold text-slate-600">제조원 그룹 X<Input type="number" value={printConfig.manufacturerGroupOffsetX} onChange={(event) => setPrintConfig((current) => ({ ...current, manufacturerGroupOffsetX: Number(event.target.value) }))} className="mt-1" /></label><label className="text-xs font-semibold text-slate-600">제조원 그룹 Y<Input type="number" value={printConfig.manufacturerGroupOffsetY} onChange={(event) => setPrintConfig((current) => ({ ...current, manufacturerGroupOffsetY: Number(event.target.value) }))} className="mt-1" /></label></div>
              <p className="text-xs text-slate-500">현재 위치: X {selectedLayout.x}dot ({dotsToMm(selectedLayout.x).toFixed(2)}mm), Y {selectedLayout.y}dot ({dotsToMm(selectedLayout.y).toFixed(2)}mm). 제조원 3개 필드는 개별 좌표에 제조원 그룹 오프셋을 더해 출력합니다.</p>
              {layoutErrors.length > 0 && <div role="alert" className="rounded-md bg-red-50 p-2 text-xs font-semibold text-red-700">{layoutErrors[0]} 저장 및 출력을 진행할 수 없습니다.</div>}
            </div>
            <p className="mt-2 text-xs text-slate-500">QZ Tray가 이 PC에서 실행 중이어야 하며 Windows에 등록된 프린터 이름과 정확히 일치해야 합니다. <a href="https://qz.io/download/" target="_blank" rel="noreferrer" className="font-semibold text-blue-600 underline">QZ Tray 설치</a></p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-bold text-slate-900">박스라벨(20kg)</h3><p className="mt-1 text-sm text-slate-500">미리보기 데이터로 TSPL 60×90mm 라벨 1장을 직접 전송합니다.</p></div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => window.print()} disabled={!selected}>브라우저 인쇄</Button><Button type="button" variant="outline" onClick={saveDebugArtifacts} disabled={!selected || savingDebug}>{savingDebug ? "진단 저장 중..." : "디버그 저장"}</Button><Button type="button" onClick={printOneLabel} disabled={!selected || printing}><Printer size={17} />{printing ? "TSPL 전송 중..." : "직접 인쇄"}</Button></div></div>
          {!selected ? <div className="mt-5 rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">제품을 검색한 후 선택해 주세요.</div> : <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">제품명<Input value={labelData.productName} onChange={(event) => setLabelData((current) => ({ ...current, productName: event.target.value }))} className="mt-1" /></label>
            <label className="text-xs font-semibold text-slate-600">냉동 문구<Input value={labelData.frozenText} onChange={(event) => setLabelData((current) => ({ ...current, frozenText: event.target.value }))} className="mt-1" /></label>
            <label className="text-xs font-semibold text-slate-600">중량<Input value={labelData.weight} onChange={(event) => setLabelData((current) => ({ ...current, weight: event.target.value }))} className="mt-1" /></label>
            <label className="text-xs font-semibold text-slate-600">중량 단위<Input value={labelData.weightUnit} onChange={(event) => setLabelData((current) => ({ ...current, weightUnit: event.target.value }))} className="mt-1" /></label>
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">제품규격<Input value={labelData.productSpec} onChange={(event) => setLabelData((current) => ({ ...current, productSpec: event.target.value }))} className="mt-1" /></label>
            <label className="text-xs font-semibold text-slate-600">품목보고번호<Input value={labelData.reportNumber} onChange={(event) => setLabelData((current) => ({ ...current, reportNumber: event.target.value }))} className="mt-1" /></label>
            <label className="text-xs font-semibold text-slate-600">수입이력번호/바코드<Input value={labelData.barcodeNumber} onChange={(event) => setLabelData((current) => ({ ...current, historyNumber: event.target.value, barcodeNumber: event.target.value }))} className="mt-1" /></label>
            <label className="text-xs font-semibold text-slate-600">원산지<Input value={labelData.countryOfOrigin} onChange={(event) => setLabelData((current) => ({ ...current, countryOfOrigin: event.target.value }))} className="mt-1" /></label>
            <label className="text-xs font-semibold text-slate-600">오늘 날짜<Input value={labelData.manufactureDate} onChange={(event) => setLabelData((current) => ({ ...current, manufactureDate: event.target.value }))} className="mt-1" /></label>
            <label className="text-xs font-semibold text-slate-600">유통기한<Input value={labelData.expirationDate} onChange={(event) => setLabelData((current) => ({ ...current, expirationDate: event.target.value }))} className="mt-1" /></label>
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">원료 및 함량<textarea value={labelData.material} onChange={(event) => setLabelData((current) => ({ ...current, material: event.target.value }))} rows={4} className="mt-1 w-full rounded-md border border-slate-300 p-3" /></label>
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">원료 및 함량 제목<Input value={labelData.materialLabel} onChange={(event) => setLabelData((current) => ({ ...current, materialLabel: event.target.value }))} className="mt-1" /></label>
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">포장재질<textarea value={labelData.packagingMaterial} onChange={(event) => setLabelData((current) => ({ ...current, packagingMaterial: event.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-slate-300 p-3" /></label>
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">주의사항<textarea value={labelData.notice} onChange={(event) => setLabelData((current) => ({ ...current, notice: event.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-slate-300 p-3" /></label>
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">제조원<Input value={labelData.manufacturer} onChange={(event) => setLabelData((current) => ({ ...current, manufacturer: event.target.value }))} className="mt-1" /></label>
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">제조원 주소<textarea value={labelData.manufacturerAddress} onChange={(event) => setLabelData((current) => ({ ...current, manufacturerAddress: event.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-slate-300 p-3" /></label>
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">전화번호<Input value={labelData.manufacturerPhone} onChange={(event) => setLabelData((current) => ({ ...current, manufacturerPhone: event.target.value }))} className="mt-1" /></label>
            <div className="flex flex-wrap gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={resetSelectedValue}>선택 필드 원본값 복원</Button><Button type="button" variant="outline" onClick={() => setLabelData(sourceLabelData)}>전체 내용 초기화</Button></div>
            <p className="text-xs text-slate-500 sm:col-span-2">여기서 수정한 값은 현재 인쇄 세션에만 적용되며 제품 DB에는 저장되지 않습니다.</p>
          </div>}
          {selected && selected.product.activeHistories.length > 1 && <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">활성 이력 {selected.product.activeHistories.length}개 중 {selected.history.historyNumber || "번호 없는 이력"}을 선택했습니다.</p>}
          {missing.length > 0 && <div className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800"><AlertTriangle className="mt-0.5 shrink-0" size={17} /><span>다음 정보가 없어 빈 값으로 표시됩니다: {missing.join(", ")}</span></div>}
        </div>
        <div className="label-preview-shell"><CanvasPreview data={labelData} layout={printConfig} selectedField={selectedField} onSelectField={setSelectedField} /></div>
      </div> : <div className="screen-only flex min-h-80 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white"><div className="text-center"><Printer className="mx-auto text-slate-300" size={36} /><h3 className="mt-3 font-bold text-slate-700">{tabs.find((item) => item.id === tab)?.label}</h3><p className="mt-1 text-sm text-slate-500">준비 중입니다.</p></div></div>}
    </section>
  );
}
