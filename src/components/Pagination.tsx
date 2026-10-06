import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  const items: (number | "ellipsis")[] = [];
  let lastPage = 0;
  for (const p of pages) {
    if (p - lastPage > 1) items.push("ellipsis");
    items.push(p);
    lastPage = p;
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={`rounded-full border px-3 py-2 text-sm font-medium ${
          page === 1 ? "pointer-events-none border-slate-100 text-slate-300" : "border-slate-200 text-slate-600 hover:bg-slate-50"
        }`}
      >
        Prev
      </Link>
      {items.map((item, idx) =>
        item === "ellipsis" ? (
          <span key={`e-${idx}`} className="px-2 text-slate-400">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(item)}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium ${
              item === page ? "bg-blue-900 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {item}
          </Link>
        ),
      )}
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={`rounded-full border px-3 py-2 text-sm font-medium ${
          page === totalPages ? "pointer-events-none border-slate-100 text-slate-300" : "border-slate-200 text-slate-600 hover:bg-slate-50"
        }`}
      >
        Next
      </Link>
    </nav>
  );
}
