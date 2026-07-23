import { LabelPrinterWorkspace } from "@/components/label-printer/label-printer-workspace";

export const dynamic = "force-dynamic";

export default function LabelPrinterPage() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div>
        <p className="text-sm font-medium text-blue-600">출력 관리</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">라벨 프린터</h2>
        <p className="mt-1 text-sm text-slate-500">제품과 현재 사용 중인 수입이력을 조회하여 라벨을 미리 보고 출력합니다.</p>
      </div>
      <LabelPrinterWorkspace />
    </div>
  );
}
