import { ClientSearch } from "@/components/clients/client-search";
import { ClientTable } from "@/components/clients/client-table";
import { getClients } from "@/lib/clients/queries";

type SearchParams = Promise<{ query?: string }>;

export const dynamic = "force-dynamic";

export default async function ClientsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await searchParams;
  const clients = await getClients(filters);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div>
        <p className="text-sm font-medium text-blue-600">거래처 관리</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">거래처</h2>
        <p className="mt-1 text-sm text-slate-500">등록된 거래처를 거래처명 또는 핸드폰 번호로 검색할 수 있습니다.</p>
      </div>
      <ClientSearch query={filters.query} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">총 <strong className="text-slate-900">{clients.length}</strong>개</p>
      </div>
      <ClientTable clients={clients} />
    </div>
  );
}
