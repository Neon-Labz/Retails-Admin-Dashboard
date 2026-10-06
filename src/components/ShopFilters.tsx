"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Category } from "@/lib/types";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "popular", label: "Most Popular" },
];

export function ShopFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const activeCategory = searchParams.get("category") ?? "";
  const activeSort = searchParams.get("sort") ?? "newest";
  const inStock = searchParams.get("inStock") === "true";
  const featured = searchParams.get("featured") === "true";

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    router.push(`/shop?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam("search", search.trim() || null);
  }

  function clearAll() {
    setSearch("");
    router.push("/shop");
  }

  const hasFilters = activeCategory || activeSort !== "newest" || inStock || featured || searchParams.get("search");

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <form onSubmit={handleSearchSubmit} className="mb-6">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Search
        </label>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            placeholder="Search products..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-700"
          />
        </div>
      </form>

      <div className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Sort by</h3>
        <select
          value={activeSort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-700"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Category</h3>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => updateParam("category", null)}
            className={`rounded-lg px-3 py-1.5 text-left text-sm ${
              !activeCategory ? "bg-blue-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParam("category", cat.slug)}
              className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm ${
                activeCategory === cat.slug ? "bg-blue-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{cat.name}</span>
              <span className={activeCategory === cat.slug ? "text-blue-200" : "text-slate-400"}>
                {cat.productCount}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => updateParam("inStock", e.target.checked ? "true" : null)}
            className="h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-700"
          />
          In stock only
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => updateParam("featured", e.target.checked ? "true" : null)}
            className="h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-700"
          />
          Featured only
        </label>
      </div>

      {hasFilters && (
        <button onClick={clearAll} className="text-sm font-semibold text-rose-600 hover:underline">
          Clear all filters
        </button>
      )}
    </aside>
  );
}
