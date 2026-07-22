import { ProductDialog } from "@/components/products/product-dialog";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductTable } from "@/components/products/product-table";
import { getProductCategories, getProducts } from "@/lib/products/queries";

type SearchParams = Promise<{ query?: string; category?: string }>;

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await searchParams;
  const [products, categories] = await Promise.all([getProducts(filters), getProductCategories()]);
  return <div className="mx-auto max-w-[1500px] space-y-5"><div className="flex items-end justify-between"><div><p className="text-sm font-medium text-blue-600">제품 관리</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">우리 제품</h2><p className="mt-1 text-sm text-slate-500">식품안전나라에 등록된 데이터를 기반으로 작성된 데이터입니다.</p></div><ProductDialog /></div><ProductFilters categories={categories} defaults={filters} />
  <div className="flex items-center justify-between"><p className="text-sm text-slate-600">총 <strong className="text-slate-900">{products.length}</strong>개</p></div><ProductTable products={products} /></div>;
}
