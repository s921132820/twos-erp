import Link from "next/link";
import { ArrowRight, Boxes, FolderTree, PackageSearch } from "lucide-react";
import { getDashboardSummary } from "@/lib/dashboard/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { productCount, categoryCount, recentProducts } = await getDashboardSummary();

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <section>
        <p className="text-sm font-medium text-blue-600">대시보드</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">투에스푸드 ERP에 오신 것을 환영합니다.</h2>
        <p className="mt-1 text-sm text-slate-500">실제 상품 데이터를 한눈에 확인하고 관리 메뉴로 이동할 수 있습니다.</p>
      </section>

      <section aria-label="상품 현황" className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-600">전체 상품</p><span className="rounded-lg bg-blue-50 p-2 text-blue-600"><Boxes size={20} /></span></div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{productCount.toLocaleString("ko-KR")}<span className="ml-1 text-base font-medium text-slate-500">개</span></p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-600">카테고리</p><span className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><FolderTree size={20} /></span></div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{categoryCount.toLocaleString("ko-KR")}<span className="ml-1 text-base font-medium text-slate-500">개</span></p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h3 className="font-bold text-slate-900">최근 등록 상품</h3><Link href="/products" className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">전체 보기 <ArrowRight size={15} /></Link></div>
          {recentProducts.length === 0 ? <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">등록된 상품이 없습니다.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold text-slate-500"><tr><th className="px-5 py-3">제품 ID</th><th className="px-5 py-3">품목보고번호</th><th className="px-5 py-3">제품명</th><th className="px-5 py-3">카테고리</th><th className="px-5 py-3">제품유형</th></tr></thead><tbody className="divide-y divide-slate-100">{recentProducts.map((product) => <tr key={product.id}><td className="px-5 py-3 font-mono text-xs text-slate-600">{product.id}</td><td className="px-5 py-3 text-slate-600">{product.code}</td><td className="px-5 py-3 font-semibold text-slate-900">{product.name}</td><td className="px-5 py-3 text-slate-600">{product.category}</td><td className="px-5 py-3 text-slate-600">{product.unit}</td></tr>)}</tbody></table></div>}
        </div>

        <Link href="/products" className="group flex min-h-56 flex-col justify-between rounded-xl bg-slate-900 p-6 text-white shadow-sm transition-colors hover:bg-slate-800">
          <span className="w-fit rounded-lg bg-white/10 p-3"><PackageSearch size={24} /></span>
          <span><strong className="block text-xl">우리 제품 관리</strong><span className="mt-2 flex items-center gap-1 text-sm text-slate-300">상품 목록으로 이동 <ArrowRight className="transition-transform group-hover:translate-x-1" size={16} /></span></span>
        </Link>
      </section>
    </div>
  );
}
