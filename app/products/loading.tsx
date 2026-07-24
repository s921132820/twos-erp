export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-5" role="status" aria-live="polite">
      <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
      <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
      <div className="flex min-h-72 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-500">
        제품 목록을 불러오는 중입니다...
      </div>
    </div>
  );
}
