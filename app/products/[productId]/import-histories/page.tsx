import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { ImportHistoryManager } from "@/components/products/import-history-manager";
import { getProductWithImportHistories } from "@/lib/products/queries";

type PageParams = Promise<{ productId: string }>;

export const dynamic = "force-dynamic";

export default async function ImportHistoriesPage({ params }: { params: PageParams }) {
  const { productId } = await params;
  const product = await getProductWithImportHistories(productId);
  if (!product) notFound();

  return <div className="mx-auto max-w-[1500px] space-y-6">
    <div><Link href="/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600"><ArrowLeft size={16} />우리 제품으로 돌아가기</Link></div>
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div><p className="flex items-center gap-1.5 text-sm font-medium text-blue-600"><ClipboardList size={16} />수입축산물 이력 관리</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{product.name}</h2><p className="mt-1 text-sm text-slate-500">제품 ID {product.id} · 품목보고번호 {product.code}</p></div>
      <p className="text-sm text-slate-600">등록된 이력 <strong className="text-slate-900">{product.importLivestockHistories.length}</strong>건</p>
    </section>
    <section aria-label="제품 정보" className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
      <div><p className="text-xs font-semibold text-slate-400">제품 ID</p><p className="mt-1 font-medium text-slate-800">{product.id}</p></div>
      <div><p className="text-xs font-semibold text-slate-400">품목보고번호</p><p className="mt-1 font-medium text-slate-800">{product.code}</p></div>
      <div><p className="text-xs font-semibold text-slate-400">카테고리</p><p className="mt-1 font-medium text-slate-800">{product.category}</p></div>
      <div><p className="text-xs font-semibold text-slate-400">제품유형</p><p className="mt-1 font-medium text-slate-800">{product.unit}</p></div>
    </section>
    <ImportHistoryManager product={product} />
  </div>;
}
