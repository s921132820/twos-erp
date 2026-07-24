import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function href(page: number, limit: number, search: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  return `/clients?${params.toString()}`;
}

export function ClientPagination({ page, totalPages, limit, search = "" }: { page: number; totalPages: number; limit: number; search?: string }) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages = Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);

  return (
    <nav aria-label="거래처 페이지" className="flex flex-wrap items-center justify-center gap-1">
      <Button asChild={page > 1} disabled={page <= 1} size="sm" variant="outline">
        {page > 1 ? <Link href={href(page - 1, limit, search)}><ChevronLeft size={15} />이전</Link> : <span><ChevronLeft size={15} />이전</span>}
      </Button>
      {pages.map((number) => (
        <Button key={number} asChild={number !== page} size="sm" variant={number === page ? "default" : "outline"} aria-current={number === page ? "page" : undefined}>
          {number === page ? <span>{number}</span> : <Link href={href(number, limit, search)}>{number}</Link>}
        </Button>
      ))}
      <Button asChild={page < totalPages} disabled={page >= totalPages} size="sm" variant="outline">
        {page < totalPages ? <Link href={href(page + 1, limit, search)}>다음<ChevronRight size={15} /></Link> : <span>다음<ChevronRight size={15} /></span>}
      </Button>
    </nav>
  );
}
