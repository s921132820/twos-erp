import { ClientSearch } from "@/components/clients/client-search";
import { ClientPagination } from "@/components/clients/client-pagination";
import { ClientTable } from "@/components/clients/client-table";
import { getClients } from "@/lib/clients/queries";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type SearchParams = Promise<{ search?: string; page?: string; limit?: string }>;

export const dynamic = "force-dynamic";

export default async function ClientsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await searchParams;
  const result = await getClients({
    search: filters.search,
    page: Number(filters.page),
    limit: Number(filters.limit),
  });

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-sm font-medium text-blue-600">거래처 관리</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">거래처</h2><p className="mt-1 text-sm text-slate-500">등록된 거래처를 거래처명 또는 핸드폰 번호로 검색할 수 있습니다.</p></div>
        <Button asChild><Link href="/clients/new"><Plus size={17} />거래처 등록</Link></Button>
      </div>
      <ClientSearch search={filters.search} limit={result.limit} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">총 <strong className="text-slate-900">{result.total}</strong>개</p>
      </div>
      <ClientTable clients={result.clients} page={result.page} limit={result.limit} />
      <ClientPagination page={result.page} totalPages={result.totalPages} limit={result.limit} search={filters.search} />
    </div>
  );
}
