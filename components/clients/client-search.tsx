import Link from "next/link";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ClientSearch({ query = "" }: { query?: string }) {
  return (
    <form action="/clients" method="get" className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
        <Input name="query" defaultValue={query} placeholder="거래처명 또는 핸드폰 번호 검색" maxLength={100} className="pl-10" />
      </div>
      <Button type="submit"><Search size={16} />검색</Button>
      {query && <Button asChild type="button" variant="outline"><Link href="/clients"><X size={16} />초기화</Link></Button>}
    </form>
  );
}
