import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Printer } from "lucide-react";
import { LabelPrinterWorkspace, type LabelSelection } from "@/components/label-printer/label-printer-workspace";
import { getProductHistory } from "@/lib/products/queries";

type PageParams = Promise<{ productId: string; historyId: string }>;
export const dynamic = "force-dynamic";

function dateOnly(value: Date | null) { return value ? new Intl.DateTimeFormat("ko-KR").format(value) : "-"; }

export default async function HistoryDetailPage({ params }: { params: PageParams }) {
  const { productId, historyId: historyIdText } = await params;
  const historyId = Number(historyIdText);
  if (!Number.isSafeInteger(historyId) || historyId < 1) notFound();
  const history = await getProductHistory(productId, historyId);
  if (!history) notFound();

  const { product } = history;
  const fields = [
    ["제품명", product.name], ["수입일자", dateOnly(history.importDate)], ["원산지", history.countryOfOrigin || "-"],
    ["공급업체", history.supplierName || "-"], ["품목명", history.itemName || "-"], ["B/L 번호", history.billOfLadingNumber || "-"],
    ["수출업체", history.exporterName || "-"], ["해외 도축장", history.foreignSlaughterhouse || "-"], ["해외 가공장", history.foreignProcessingPlant || "-"],
    ["부위명/부위코드", history.partNameCode || "-"], ["해외 도축일자", dateOnly(history.foreignSlaughterDate)], ["소비기한", dateOnly(history.expirationDate)],
    ["사용 여부", history.isActive ? "사용" : "미사용"], ["메모", history.memo || "-"],
  ];
  const initialSelection: LabelSelection = {
    product: { id: product.id, name: product.name, code: product.code, material: product.material, activeHistories: [] },
    history: { id: history.id, historyNumber: history.historyNumber, countryOfOrigin: history.countryOfOrigin, foreignSlaughterDate: history.foreignSlaughterDate?.toISOString().slice(0, 10) ?? null },
  };

  return <div className="mx-auto max-w-[1500px] space-y-7">
    <nav aria-label="현재 위치" className="flex flex-wrap items-center gap-1 text-sm text-slate-500"><Link href="/products" className="font-semibold hover:text-blue-600">우리 제품</Link><ChevronRight size={15} /><Link href={`/products/${encodeURIComponent(product.id)}`} className="font-semibold hover:text-blue-600">{product.name}</Link><ChevronRight size={15} /><span aria-current="page" className="text-slate-800">{history.historyNumber || `이력 #${history.id}`}</span></nav>
    <header><p className="text-sm font-medium text-blue-600">수입 이력 상세</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{history.historyNumber || `이력 #${history.id}`}</h2><p className="mt-1 text-sm text-slate-500">{product.name}</p></header>
    <section aria-labelledby="history-info-title" className="border-y border-slate-200 bg-white py-6"><h3 id="history-info-title" className="mb-5 text-base font-bold text-slate-900">수입 상세정보</h3><dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">{fields.map(([label, value], index) => <div key={label} className={index === fields.length - 1 ? "sm:col-span-2 lg:col-span-4" : ""}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-900">{value}</dd></div>)}</dl></section>
    <section aria-labelledby="label-printer-title"><div className="mb-5"><h3 id="label-printer-title" className="flex items-center gap-2 text-lg font-bold text-slate-900"><Printer size={19} />라벨 출력</h3><p className="mt-1 text-sm text-slate-500">현재 제품과 이력정보가 라벨에 자동 적용됩니다.</p></div><LabelPrinterWorkspace initialSelection={initialSelection} /></section>
  </div>;
}
