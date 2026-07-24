import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/clients/client-form";
import { getClient } from "@/lib/clients/queries";

type Params = Promise<{ clientId: string }>;

export default async function EditClientPage({ params }: { params: Params }) {
  const { clientId } = await params;
  const client = await getClient(decodeURIComponent(clientId));
  if (!client) notFound();
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href={`/clients/${encodeURIComponent(client.id)}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600"><ArrowLeft size={16} />거래처 상세로 돌아가기</Link>
      <div><p className="text-sm font-medium text-blue-600">거래처 관리</p><h2 className="mt-1 text-2xl font-bold text-slate-900">거래처 수정</h2><p className="mt-1 text-sm text-slate-500">{client.companyName}의 정보를 수정합니다.</p></div>
      <ClientForm client={client} />
    </div>
  );
}
