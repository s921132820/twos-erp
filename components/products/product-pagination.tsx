import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductSearchType } from "@/lib/products/queries";

type ProductPaginationProps = {
  page: number;
  totalPages: number;
  size: number;
  keyword?: string;
  searchType: ProductSearchType;
  category?: string;
};

function href({ page, size, keyword, searchType, category }: Omit<ProductPaginationProps, "totalPages">) {
  const params = new URLSearchParams({ page: String(page), size: String(size), searchType });
  if (keyword) params.set("keyword", keyword);
  if (category) params.set("category", category);
  return `/products?${params.toString()}`;
}

export function ProductPagination({ page, totalPages, size, keyword, searchType, category }: ProductPaginationProps) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages = Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
  const pageHref = (targetPage: number) => href({ page: targetPage, size, keyword, searchType, category });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500">
        {page} / {totalPages} 페이지
      </p>
      <nav aria-label="제품 페이지" className="flex flex-wrap items-center justify-center gap-1">
        <Button asChild={page > 1} disabled={page <= 1} size="sm" variant="outline">
          {page > 1 ? <Link href={pageHref(page - 1)}><ChevronLeft size={15} />이전</Link> : <span><ChevronLeft size={15} />이전</span>}
        </Button>
        {pages.map((number) => (
          <Button key={number} asChild={number !== page} size="sm" variant={number === page ? "default" : "outline"} aria-current={number === page ? "page" : undefined}>
            {number === page ? <span>{number}</span> : <Link href={pageHref(number)}>{number}</Link>}
          </Button>
        ))}
        <Button asChild={page < totalPages} disabled={page >= totalPages} size="sm" variant="outline">
          {page < totalPages ? <Link href={pageHref(page + 1)}>다음<ChevronRight size={15} /></Link> : <span>다음<ChevronRight size={15} /></span>}
        </Button>
      </nav>
    </div>
  );
}
