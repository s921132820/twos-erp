"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteProductButton } from "./delete-product-button";
import type { ProductWithImportHistories } from "./import-history-manager";
import { ProductDialog } from "./product-dialog";

export function ProductTable({ products, page, size }: { products: ProductWithImportHistories[]; page: number; size: number }) {
  const router = useRouter();

  if (products.length === 0) {
    return <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-center"><PackageOpen size={38} className="mb-3 text-slate-300" /><p className="font-semibold text-slate-700">등록된 상품이 없습니다.</p><p className="mt-1 text-sm text-slate-500">검색 조건을 바꾸거나 새 제품을 등록해 주세요.</p></div>;
  }

  const headers = ["번호", "제품 ID", "품목보고번호", "제품명", "제품유형", "종류", "소비기한", "카테고리", "등록일", "관리"];
  const productHref = (productId: string) => `/products/${encodeURIComponent(productId)}/import-histories`;
  const openProduct = (productId: string) => router.push(productHref(productId));
  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, productId: string) => {
    if ((event.target as HTMLElement).closest("button, a, input, select, textarea, [role='button']")) return;
    openProduct(productId);
  };
  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, productId: string) => {
    if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    openProduct(productId);
  };

  return <div className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[1250px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr>{headers.map((header) => <th key={header} className="border-b border-slate-200 px-5 py-3.5">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{products.map((product, index) => <tr key={product.id} role="link" tabIndex={0} aria-label={`${product.name} 상세 및 수입이력 보기`} onClick={(event) => handleRowClick(event, product.id)} onKeyDown={(event) => handleRowKeyDown(event, product.id)} className="cursor-pointer transition-colors hover:bg-blue-50/70 focus-visible:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"><td className="px-5 py-4 text-slate-500">{(page - 1) * size + index + 1}</td><td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">{product.id}</td><td className="px-5 py-4 text-slate-600">{product.code}</td><td className="px-5 py-4 font-semibold text-slate-900">{product.name}</td><td className="px-5 py-4 text-slate-600">{product.unit}</td><td className="px-5 py-4 text-slate-600">{product.kind}</td><td className="px-5 py-4 text-slate-600">{product.description}</td><td className="px-5 py-4 text-slate-600">{product.category}</td><td className="px-5 py-4 whitespace-nowrap text-slate-600">{product.createdAt ? new Intl.DateTimeFormat("ko-KR").format(product.createdAt) : "-"}</td><td className="px-5 py-4"><div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}><span className="mr-1 whitespace-nowrap text-xs font-medium text-slate-500">수입이력 {product.importLivestockHistories.length}건</span><ProductDialog product={product} trigger={<Button size="sm" variant="ghost">수정</Button>} /><DeleteProductButton id={product.id} name={product.name} /></div></td></tr>)}</tbody></table></div></div>;
}
