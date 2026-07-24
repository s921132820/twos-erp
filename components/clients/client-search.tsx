"use client";

import { useRef } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const PAGE_LIMITS = [10, 50, 100] as const;

export function ClientSearch({ search = "", limit = 10 }: { search?: string; limit?: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action="/clients" method="get" className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 lg:flex-row">
      <input type="hidden" name="page" value="1" />
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
        <Input name="search" defaultValue={search} placeholder="거래처명 또는 핸드폰 번호 검색" maxLength={100} className="pl-10" />
      </div>
      <select name="limit" defaultValue={limit} onChange={() => formRef.current?.requestSubmit()} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700">
        {PAGE_LIMITS.map((value) => <option key={value} value={value}>{value}개씩 보기</option>)}
      </select>
      <Button type="submit"><Search size={16} />검색</Button>
      {search && <Button asChild type="button" variant="outline"><Link href={`/clients?limit=${limit}`}><X size={16} />초기화</Link></Button>}
    </form>
  );
}
