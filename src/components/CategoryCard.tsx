import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/types";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/shop?category=${category.slug}`}
      className="group relative flex h-40 flex-col justify-end overflow-hidden rounded-2xl bg-slate-900 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:h-48"
    >
      {category.image && (
        <Image
          src={category.image}
          alt={category.name}
          fill
          sizes="(max-width: 768px) 50vw, 20vw"
          className="object-cover opacity-70 transition duration-300 group-hover:scale-105 group-hover:opacity-80"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="relative z-10">
        <h3 className="text-base font-bold text-white sm:text-lg">{category.name}</h3>
        <p className="text-xs text-white/80">{category.productCount} products</p>
      </div>
    </Link>
  );
}
