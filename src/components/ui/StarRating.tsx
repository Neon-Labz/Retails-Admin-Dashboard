export function StarRating({ rating, size = 14 }: { rating: number | string; size?: number }) {
  const value = Math.round(Number(rating) * 2) / 2;
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rated ${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i + 1 <= Math.floor(value);
        const half = !filled && i + 0.5 === value;
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={filled || half ? "text-amber-400" : "text-slate-200"}
            fill={filled ? "currentColor" : half ? "url(#half)" : "currentColor"}
          >
            {half && (
              <defs>
                <linearGradient id="half">
                  <stop offset="50%" stopColor="currentColor" className="text-amber-400" />
                  <stop offset="50%" stopColor="currentColor" className="text-slate-200" stopOpacity="1" />
                </linearGradient>
              </defs>
            )}
            <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 19.771l-7.416 3.642 1.48-8.279L.001 9.306l8.332-1.151z" />
          </svg>
        );
      })}
    </div>
  );
}
