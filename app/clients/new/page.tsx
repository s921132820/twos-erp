import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClientForm } from "@/components/clients/client-form";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600"><ArrowLeft size={16} />거래처 목록으로 돌아가기</Link>
      <div>
        <p className="text-sm font-medium text-blue-600">거래처 관리</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">거래처 등록</h2>
        <p className="mt-1 text-sm text-slate-500">거래처 ID와 등록일은 저장 시 자동으로 생성됩니다.</p>
      </div>
      <ClientForm />
    </div>
  );
}
