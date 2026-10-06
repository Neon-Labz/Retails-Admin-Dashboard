"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { clamp } from "@/lib/utils";
import type { ProductDetail } from "@/lib/types";

export function AddToCartSection({ product }: { product: ProductDetail }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock <= 0;

  function changeQuantity(delta: number) {
    setQuantity((q) => clamp(q + delta, 1, Math.max(1, product.stock)));
  }

  function handleAddToCart() {
    if (outOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      image: product.images?.[0] ?? null,
      quantity,
      stock: product.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push("/cart");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-600">Quantity</span>
        <div className="flex items-center rounded-full border border-slate-200">
          <button
            onClick={() => changeQuantity(-1)}
            className="flex h-9 w-9 items-center justify-center text-lg text-slate-600 hover:text-slate-900"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
          <button
            onClick={() => changeQuantity(1)}
            className="flex h-9 w-9 items-center justify-center text-lg text-slate-600 hover:text-slate-900"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <span className="text-xs text-slate-400">{product.stock} in stock</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleAddToCart}
          disabled={outOfStock}
          className={`flex-1 rounded-full px-6 py-3 text-sm font-bold transition ${
            added ? "bg-emerald-600 text-white" : "bg-blue-900 text-white hover:bg-blue-800"
          } disabled:cursor-not-allowed disabled:bg-slate-300`}
        >
          {outOfStock ? "Out of stock" : added ? "Added to cart ✓" : "Add to cart"}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={outOfStock}
          className="flex-1 rounded-full border border-blue-900 px-6 py-3 text-sm font-bold text-blue-900 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
        >
          Buy now
        </button>
      </div>
    </div>
  );
}
