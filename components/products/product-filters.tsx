import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProductFilters({ categories, defaults }: { categories: string[]; defaults: { query?: string; category?: string; active?: string } }) {
  return (
    <form action="/products" className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[minmax(240px,1fr)_180px_150px_auto_auto]">
      <label className="relative"><span className="sr-only">품목명 또는 품목코드 검색</span><Search className="absolute left-3 top-3 text-slate-400" size={17} /><Input name="query" defaultValue={defaults.query} placeholder="품목명 또는 품목코드 검색" className="pl-9" /></label>
      <label><span className="sr-only">카테고리</span><select name="category" defaultValue={defaults.category ?? ""} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="">모든 카테고리</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span className="sr-only">사용 여부</span><select name="active" defaultValue={defaults.active ?? ""} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="">전체 상태</option><option value="true">사용</option><option value="false">미사용</option></select></label>
      <Button type="submit">조회</Button>
      <Button asChild variant="outline"><a href="/products">초기화</a></Button>
    </form>
  );
}
