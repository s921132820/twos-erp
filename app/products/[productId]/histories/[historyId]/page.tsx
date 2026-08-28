import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Printer } from "lucide-react";
import { LabelPrinterWorkspace, type LabelSelection } from "@/components/label-printer/label-printer-workspace";
import { getProductHistory } from "@/lib/products/queries";

type PageParams = Promise<{ productId: string; historyId: string }>;
export const dynamic = "force-dynamic";

function dateOnly(value: Date | null) { return value?.toISOString().slice(0, 10) || "-"; }

function DetailGroup({ title, fields }: { title: string; fields: Array<{ label: string; value: string; wide?: boolean; status?: "active" | "inactive" }> }) {
  return <section aria-labelledby={`history-${title}`} className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"><h3 id={`history-${title}`} className="mb-5 text-base font-bold text-slate-900">{title}</h3><dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">{fields.map((field) => <div key={field.label} className={field.wide ? "sm:col-span-2 lg:col-span-3" : ""}><dt className="text-xs font-semibold text-slate-500">{field.label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-900">{field.status ? <span className={field.status === "active" ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700" : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500"}>{field.value}</span> : field.value}</dd></div>)}</dl></section>;
}

export default async function HistoryDetailPage({ params }: { params: PageParams }) {
  const { productId, historyId: historyIdText } = await params;
  const historyId = Number(historyIdText);
  if (!Number.isSafeInteger(historyId) || historyId < 1) notFound();
  const history = await getProductHistory(productId, historyId);
  if (!history) notFound();

  const { product } = history;
  const basicFields = [
    { label: "이력번호", value: history.historyNumber || `이력 #${history.id}` }, { label: "품목명", value: history.itemName || "-" },
    { label: "원산지", value: history.countryOfOrigin || "-" }, { label: "수입일", value: dateOnly(history.importDate) },
    { label: "소비기한", value: dateOnly(history.expirationDate) }, { label: "상태", value: history.isActive ? "사용중" : "미사용", status: history.isActive ? "active" as const : "inactive" as const },
  ];
  const importFields = [
    { label: "공급업체", value: history.supplierName || "-" }, { label: "B/L 번호", value: history.billOfLadingNumber || "-" },
    { label: "수출업체", value: history.exporterName || "-" }, { label: "메모", value: history.memo || "-", wide: true },
  ];
  const workplaceFields = [
    { label: "해외 도축장", value: history.foreignSlaughterhouse || "-" }, { label: "해외 가공장", value: history.foreignProcessingPlant || "-" },
    { label: "부위명/부위코드", value: history.partNameCode || "-" }, { label: "해외 도축일", value: dateOnly(history.foreignSlaughterDate) },
  ];
  const initialSelection: LabelSelection = {
    product: { id: product.id, name: product.name, code: product.code, material: product.material, activeHistories: [] },
    history: { id: history.id, historyNumber: history.historyNumber, countryOfOrigin: history.countryOfOrigin, foreignSlaughterDate: history.foreignSlaughterDate?.toISOString().slice(0, 10) ?? null },
  };

  return <div className="mx-auto max-w-[1500px] space-y-7">
    <nav aria-label="현재 위치" className="flex flex-wrap items-center gap-1 text-sm text-slate-500"><Link href="/products" className="font-semibold hover:text-blue-600">우리 제품</Link><ChevronRight size={15} /><Link href={`/products/${encodeURIComponent(product.id)}`} className="font-semibold hover:text-blue-600">{product.name}</Link><ChevronRight size={15} /><span aria-current="page" className="text-slate-800">{history.historyNumber || `이력 #${history.id}`}</span></nav>
    <header><p className="text-sm font-medium text-blue-600">수입 이력 상세</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{history.historyNumber || `이력 #${history.id}`}</h2><p className="mt-1 text-sm text-slate-500">{product.name}</p></header>
    <div className="grid gap-4"><DetailGroup title="기본 정보" fields={basicFields} /><DetailGroup title="수입 정보" fields={importFields} /><DetailGroup title="해외 작업장 정보" fields={workplaceFields} /></div>
    <section aria-labelledby="label-printer-title" className="border-t border-slate-200 pt-7"><div className="mb-5"><h3 id="label-printer-title" className="flex items-center gap-2 text-lg font-bold text-slate-900"><Printer size={19} />라벨 출력</h3><p className="mt-1 text-sm text-slate-500">현재 제품과 이력정보를 기준으로 라벨을 미리보고 출력합니다.</p></div><LabelPrinterWorkspace initialSelection={initialSelection} /></section>
  </div>;
}
