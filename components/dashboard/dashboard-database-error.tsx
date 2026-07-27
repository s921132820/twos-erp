import { AlertTriangle, Database } from "lucide-react";

export function DashboardDatabaseError() {
  return (
    <div className="mx-auto max-w-[900px]">
      <section className="rounded-xl border border-amber-200 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="rounded-lg bg-amber-50 p-3 text-amber-700"><AlertTriangle size={24} /></span>
          <div>
            <p className="text-sm font-semibold text-amber-700">대시보드를 불러오지 못했습니다</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">데이터베이스에 연결할 수 없습니다.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">MySQL 서비스와 데이터베이스 연결 설정을 확인해주세요.</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500"><Database size={14} />다른 비데이터베이스 기능은 계속 사용할 수 있습니다.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
