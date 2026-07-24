"use client";

import { useRef } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZES = [10, 50, 100] as const;

export function ProductFilters({ categories, defaults }: { categories: string[]; defaults: { query?: string; category?: string; size: number } }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action="/products" method="get" className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[minmax(240px,1fr)_200px_150px_auto_auto]">
      <input type="hidden" name="page" value="1" />
      <label className="relative"><span className="sr-only">제품 검색</span><Search className="absolute left-3 top-3 text-slate-400" size={17} /><Input name="query" defaultValue={defaults.query} placeholder="제품 ID, 보고번호 또는 제품명" className="pl-9" /></label>
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
