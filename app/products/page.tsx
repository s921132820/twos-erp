import { ProductDialog } from "@/components/products/product-dialog";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductTable } from "@/components/products/product-table";
import { getProductCategories, getProducts } from "@/lib/products/queries";

type SearchParams = Promise<{ query?: string; category?: string; active?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await searchParams;
  const [products, categories] = await Promise.all([getProducts(filters), getProductCategories()]);
  return <div className="mx-auto max-w-[1500px] space-y-5"><div className="flex items-end justify-between"><div><p className="text-sm font-medium text-blue-600">제품 관리</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">우리 제품</h2><p className="mt-1 text-sm text-slate-500">판매 제품의 기본 정보를 조회하고 관리합니다.</p></div><ProductDialog /></div><ProductFilters categories={categories} defaults={filters} /><div className="flex items-center justify-between"><p className="text-sm text-slate-600">총 <strong className="text-slate-900">{products.length}</strong>개</p></div><ProductTable products={products} /></div>;
}
