import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ImportHistoryManager } from "@/components/products/import-history-manager";
import { getProductWithImportHistories } from "@/lib/products/queries";

type PageParams = Promise<{ productId: string }>;

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: PageParams }) {
  const { productId } = await params;
  const product = await getProductWithImportHistories(productId);
  if (!product) notFound();

  const details = [
    ["제품 ID", product.id], ["품목보고번호", product.code], ["제품 종류", product.kind],
    ["제품 유형", product.unit], ["카테고리", product.category], ["소비기한", product.description],
    ["원료 및 함량", product.material || "-"],
  ];

  return <div className="mx-auto max-w-[1500px] space-y-6">
    <nav aria-label="현재 위치" className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
      <Link href="/products" className="font-semibold hover:text-blue-600">우리 제품</Link><ChevronRight size={15} />
      <span aria-current="page" className="text-slate-800">{product.name}</span>
    </nav>
    <div>
      <div><p className="text-sm font-medium text-blue-600">제품 상세</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{product.name}</h2></div>
    </div>
    <section aria-labelledby="product-info-title" className="border-y border-slate-200 bg-white py-6">
      <h3 id="product-info-title" className="mb-5 text-base font-bold text-slate-900">제품 기본정보</h3>
      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">{details.map(([label, value], index) => <div key={label} className={index === details.length - 1 ? "sm:col-span-2 lg:col-span-4" : ""}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-900">{value}</dd></div>)}</dl>
    </section>
    <section aria-label="수입축산물 이력">
      <ImportHistoryManager product={product} />
    </section>
  </div>;
}
