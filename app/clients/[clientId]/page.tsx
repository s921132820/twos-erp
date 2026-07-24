import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/clients/queries";

type Params = Promise<{ clientId: string }>;

const display = (value: string | null) => value?.trim() || "-";
const dateTime = (value: Date | null) => value
  ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeStyle: "short" }).format(value)
  : "-";

export default async function ClientDetailPage({ params }: { params: Params }) {
  const { clientId } = await params;
  const client = await getClient(decodeURIComponent(clientId));
  if (!client) notFound();

  const fields = [
    ["거래처 ID", client.id],
    ["거래처명", client.companyName],
    ["수화인명", client.consigneeName],
    ["우편번호", display(client.postalCode)],
    ["주소", display(client.address)],
    ["전화번호", display(client.telephone)],
    ["핸드폰 번호", display(client.mobilePhone)],
    ["물품명", display(client.mainProduct)],
    ["배송 메시지", display(client.deliveryMessage)],
    ["메모", display(client.memo)],
    ["등록일시", dateTime(client.createdAt)],
    ["수정일시", dateTime(client.updatedAt)],
  ] as const;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600">
        <ArrowLeft size={16} />거래처 목록으로 돌아가기
      </Link>
      <div>
        <p className="text-sm font-medium text-blue-600">거래처 상세</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">{client.companyName}</h2>
        <p className="mt-1 font-mono text-sm text-slate-500">{client.id}</p>
      </div>
      <dl className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="border-b border-slate-100 p-5 odd:sm:border-r">
            <dt className="text-xs font-semibold text-slate-500">{label}</dt>
            <dd className="mt-2 whitespace-pre-wrap break-words text-sm font-medium text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
