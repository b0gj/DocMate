"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
}

export default function Pagination({ page, totalPages, total }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    startTransition(() => {
      router.push(`/doctors?${params.toString()}`);
    });
  };

  const pages = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted">
        {total} лекар{total !== 1 ? "и" : ""} намерен{total !== 1 ? "и" : ""}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1 || isPending}
          className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-card-hover transition-colors"
          aria-label="Предишна страница"
        >
          ←
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => goToPage(p)}
            disabled={isPending}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              p === page
                ? "bg-primary text-white"
                : "border border-border hover:bg-card-hover"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages || isPending}
          className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-card-hover transition-colors"
          aria-label="Следваща страница"
        >
          →
        </button>
      </div>
    </div>
  );
}
