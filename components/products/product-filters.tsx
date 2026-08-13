"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductSearchType } from "@/lib/products/queries";

const PAGE_SIZES = [10, 50, 100] as const;

const SEARCH_PLACEHOLDERS: Record<ProductSearchType, string> = {
  productName: "제품명으로 검색",
  manufacturingNo: "품목제조번호로 검색",
  historyNo: "이력번호로 검색",
};

export function ProductFilters({ categories, defaults }: { categories: string[]; defaults: { keyword?: string; searchType: ProductSearchType; category?: string; size: number } }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [searchType, setSearchType] = useState<ProductSearchType>(defaults.searchType);

  return (
    <form ref={formRef} action="/products" method="get" className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[170px_minmax(240px,1fr)_200px_150px_auto_auto]">
      <input type="hidden" name="page" value="1" />
      <label><span className="sr-only">검색 기준</span><select name="searchType" value={searchType} onChange={(event) => setSearchType(event.target.value as ProductSearchType)} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700"><option value="productName">제품명</option><option value="manufacturingNo">품목제조번호</option><option value="historyNo">이력번호</option></select></label>
      <label className="relative"><span className="sr-only">검색어 (비워두면 전체 조회)</span><Search className="absolute left-3 top-3 text-slate-400" size={17} /><Input name="keyword" defaultValue={defaults.keyword} placeholder={`${SEARCH_PLACEHOLDERS[searchType]} (비워두면 전체)`} className="pl-9" /></label>
      <label><span className="sr-only">카테고리</span><select name="category" defaultValue={defaults.category ?? ""} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="">모든 카테고리</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>
        <span className="sr-only">페이지당 제품 수</span>
        <select name="size" defaultValue={defaults.size} onChange={() => formRef.current?.requestSubmit()} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700">
          {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}개 보기</option>)}
        </select>
      </label>
      <Button type="submit">조회</Button>
      <Button asChild variant="outline"><a href={`/products?size=${defaults.size}`}>초기화</a></Button>
    </form>
  );
}
