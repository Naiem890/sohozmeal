import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const safeTotal = total ?? 0;
  const safePages = Math.max(1, totalPages ?? 1);

  if (!safeTotal) return null;

  const from = safeTotal === 0 ? 0 : Math.min((page - 1) * pageSize + 1, safeTotal);
  const to = Math.min(page * pageSize, safeTotal);

  const canPrev = page > 1;
  const canNext = page < safePages;

  const buildPages = (): (number | string)[] => {
    if (safePages <= 7) return Array.from({ length: safePages }, (_, i) => i + 1);

    const pages: (number | string)[] = [];
    const left = Math.max(2, page - 1);
    const right = Math.min(safePages - 1, page + 1);

    pages.push(1);
    if (left > 2) pages.push("left-gap");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < safePages - 1) pages.push("right-gap");
    pages.push(safePages);
    return pages;
  };

  const pages = buildPages();

  const btnBase =
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-9 w-9 disabled:pointer-events-none disabled:opacity-40";

  const pageBtn = (active: boolean) =>
    cn(
      btnBase,
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "bg-transparent text-foreground hover:bg-muted/70 border border-transparent hover:border-border/60"
    );

  const navBtn = (enabled: boolean) =>
    cn(
      btnBase,
      "border border-border/70 bg-background text-foreground shadow-sm",
      enabled
        ? "hover:bg-muted/60 hover:border-border cursor-pointer"
        : "opacity-40 cursor-not-allowed"
    );

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border/60 bg-muted/20">
      {/* Left: item range + optional per-page selector */}
      <div className="hidden sm:flex items-center gap-3">
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          {safeTotal === 0 ? (
            "No results"
          ) : (
            <>
              <span className="font-medium text-foreground">
                {from}–{to}
              </span>
              {" of "}
              <span className="font-medium text-foreground">{safeTotal}</span>
            </>
          )}
        </p>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: page controls */}
      <div className="flex items-center gap-1 ml-auto">
        <button
          className={navBtn(canPrev)}
          onClick={() => canPrev && onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p) => {
          if (p === "left-gap" || p === "right-gap") {
            return (
              <span
                key={p}
                className="h-9 w-9 flex items-center justify-center text-sm text-muted-foreground select-none"
              >
                …
              </span>
            );
          }
          return (
            <button
              key={p}
              className={pageBtn(p === page)}
              onClick={() => onPageChange(p as number)}
              aria-label={`Go to page ${p}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          );
        })}

        <button
          className={navBtn(canNext)}
          onClick={() => canNext && onPageChange(page + 1)}
          disabled={!canNext}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
