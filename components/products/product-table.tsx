import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteProductButton } from "./delete-product-button";
import type { ProductWithImportHistories } from "./import-history-manager";
import { ProductDialog } from "./product-dialog";

export function ProductTable({ products, page, size }: { products: ProductWithImportHistories[]; page: number; size: number }) {
  if (products.length === 0) {
    return <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-center"><PackageOpen size={38} className="mb-3 text-slate-300" /><p className="font-semibold text-slate-700">등록된 상품이 없습니다.</p><p className="mt-1 text-sm text-slate-500">검색 조건을 바꾸거나 새 제품을 등록해 주세요.</p></div>;
  }

  const headers = ["번호", "제품 ID", "품목보고번호", "제품명", "제품유형", "소비기한", "카테고리", "등록일", "관리"];
  return <div className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[1250px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr>{headers.map((header) => <th key={header} className="border-b border-slate-200 px-5 py-3.5">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{products.map((product, index) => <tr key={product.id} className="hover:bg-slate-50/70"><td className="px-5 py-4 text-slate-500">{(page - 1) * size + index + 1}</td><td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">{product.id}</td><td className="px-5 py-4 text-slate-600">{product.code}</td><td className="px-5 py-4 font-semibold text-slate-900">{product.name}</td><td className="px-5 py-4 text-slate-600">{product.unit}</td><td className="px-5 py-4 text-slate-600">{product.description}</td><td className="px-5 py-4 text-slate-600">{product.category}</td><td className="px-5 py-4 whitespace-nowrap text-slate-600">{product.createdAt ? new Intl.DateTimeFormat("ko-KR").format(product.createdAt) : "-"}</td><td className="px-5 py-4"><div className="flex items-center gap-1"><Button asChild size="sm" variant="outline"><Link href={`/products/${encodeURIComponent(product.id)}/import-histories`}>수입이력 {product.importLivestockHistories.length}</Link></Button><ProductDialog product={product} trigger={<Button size="sm" variant="ghost">수정</Button>} /><DeleteProductButton id={product.id} name={product.name} /></div></td></tr>)}</tbody></table></div></div>;
}
