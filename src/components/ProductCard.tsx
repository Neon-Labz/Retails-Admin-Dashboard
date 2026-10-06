"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { StarRating } from "@/components/ui/StarRating";
import { useCart } from "@/components/providers/CartProvider";
import { formatCurrency } from "@/lib/utils";
import type { ProductListItem } from "@/lib/types";

export function ProductCard({ product }: { product: ProductListItem }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const image = product.images?.[0] || "/images/placeholder-product.jpg";
  const discount =
    product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price)
      ? Math.round(100 - (Number(product.price) / Number(product.compareAtPrice)) * 100)
      : 0;
  const outOfStock = product.stock <= 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      image,
      quantity: 1,
      stock: product.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute right-3 top-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white">
            Out of stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {product.categoryName && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-800">
            {product.categoryName}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{product.name}</h3>
        <div className="flex items-center gap-1.5">
          <StarRating rating={product.rating} />
          <span className="text-xs text-slate-400">({product.reviewCount})</span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-slate-900">{formatCurrency(product.price)}</span>
            {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
              <span className="text-xs text-slate-400 line-through">{formatCurrency(product.compareAtPrice)}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition ${
              added ? "bg-emerald-600" : "bg-blue-900 hover:bg-blue-800"
            } disabled:cursor-not-allowed disabled:bg-slate-300`}
            aria-label="Add to cart"
          >
            {added ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
