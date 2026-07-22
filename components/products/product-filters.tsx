import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProductFilters({ categories, defaults }: { categories: string[]; defaults: { query?: string; category?: string } }) {
  return (
    <form action="/products" className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[minmax(240px,1fr)_200px_auto_auto]">
      <label className="relative"><span className="sr-only">제품 검색</span><Search className="absolute left-3 top-3 text-slate-400" size={17} /><Input name="query" defaultValue={defaults.query} placeholder="제품 ID, 보고번호 또는 제품명" className="pl-9" /></label>
      <label><span className="sr-only">카테고리</span><select name="category" defaultValue={defaults.category ?? ""} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="">모든 카테고리</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <Button type="submit">조회</Button>
      <Button asChild variant="outline"><a href="/products">초기화</a></Button>
    </form>
  );
}
