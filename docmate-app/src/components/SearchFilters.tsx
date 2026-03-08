"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

const SPECIALTIES = [
  "Кардиолог",
  "Невролог",
  "Дерматолог",
  "Ортопед",
  "Офталмолог",
  "Гастроентеролог",
  "Педиатър",
  "Уролог",
  "Ендокринолог",
  "Пулмолог",
];

const CITIES = ["София", "Пловдив", "Варна", "Бургас"];

const SORT_OPTIONS = [
  { value: "rating-desc", label: "Рейтинг (↓)" },
  { value: "price-asc", label: "Цена (↑)" },
  { value: "price-desc", label: "Цена (↓)" },
  { value: "name-asc", label: "Име (А-Я)" },
];

export default function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");

  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // Reset to page 1 on filter change
      startTransition(() => {
        router.push(`/doctors?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters("search", search);
  };

  const clearFilters = () => {
    setSearch("");
    startTransition(() => {
      router.push("/doctors");
    });
  };

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Търсене по име или специалност..."
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Търсене"
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
        >
          Търси
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={searchParams.get("specialty") || ""}
          onChange={(e) => updateFilters("specialty", e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
          aria-label="Специалност"
        >
          <option value="">Всички специалности</option>
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get("city") || ""}
          onChange={(e) => updateFilters("city", e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
          aria-label="Град"
        >
          <option value="">Всички градове</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get("sort") || "rating-desc"}
          onChange={(e) => updateFilters("sort", e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
          aria-label="Сортиране"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get("maxPrice") || ""}
          onChange={(e) => updateFilters("maxPrice", e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
          aria-label="Максимална цена"
        >
          <option value="">Всяка цена</option>
          <option value="50">До 50 лв.</option>
          <option value="70">До 70 лв.</option>
          <option value="100">До 100 лв.</option>
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground hover:border-foreground transition-colors"
          >
            Изчисти филтрите
          </button>
        )}
      </div>

      {isPending && (
        <div className="mt-2 text-xs text-muted">Зареждане...</div>
      )}
    </div>
  );
}
