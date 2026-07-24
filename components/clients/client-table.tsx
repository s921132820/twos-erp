import Link from "next/link";
import { Building2 } from "lucide-react";
import type { Client } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { DeleteClientButton } from "./delete-client-button";
import { CopyClientButton } from "./copy-client-button";

const display = (value: string | null) => value?.trim() || "-";

export function ClientTable({ clients, page, limit }: { clients: Client[]; page: number; limit: number }) {
  if (clients.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-center">
        <Building2 size={38} className="mb-3 text-slate-300" />
        <p className="font-semibold text-slate-700">검색 조건에 맞는 거래처가 없습니다.</p>
        <p className="mt-1 text-sm text-slate-500">거래처명 또는 핸드폰 번호를 다시 확인해 주세요.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
            <tr>
              {["No", "거래처명", "수화인", "핸드폰", "전화번호", "주소", "주요 물품", "관리"].map((header) => (
                <th key={header} className="border-b border-slate-200 px-5 py-3.5">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map((client, index) => {
              const href = `/clients/${encodeURIComponent(client.id)}`;
              const cellClass = "block px-5 py-4";
              return (
                <tr key={client.id} className="transition-colors hover:bg-blue-50/60">
                  <td><Link href={href} className={`${cellClass} text-slate-500`}>{(page - 1) * limit + index + 1}</Link></td>
                  <td><Link href={href} className={`${cellClass} font-semibold text-slate-900`}>{client.companyName}</Link></td>
                  <td><Link href={href} className={`${cellClass} text-slate-700`}>{client.consigneeName}</Link></td>
                  <td><Link href={href} className={`${cellClass} whitespace-nowrap text-slate-700`}>{display(client.mobilePhone)}</Link></td>
                  <td><Link href={href} className={`${cellClass} whitespace-nowrap text-slate-600`}>{display(client.telephone)}</Link></td>
                  <td><Link href={href} className={`${cellClass} max-w-md truncate text-slate-600`}>{display(client.address)}</Link></td>
                  <td><Link href={href} className={`${cellClass} text-slate-600`}>{display(client.mainProduct)}</Link></td>
                  <td className="px-5 py-3"><div className="flex items-center gap-1"><Button asChild size="sm" variant="outline"><Link href={`/clients/${encodeURIComponent(client.id)}/edit`}>수정</Link></Button><DeleteClientButton id={client.id} name={client.companyName} /><CopyClientButton client={client} /></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
