"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, isHydrated } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();

  const freeShippingThreshold = 100;
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 9.99;
  const bulkDiscount = subtotal >= 300 ? Number((subtotal * 0.05).toFixed(2)) : 0;
  const total = Number((subtotal - bulkDiscount + shippingFee).toFixed(2));

  function handleCheckout() {
    if (!user) {
      router.push("/login?redirect=/checkout");
      return;
    }
    if (!user.emailVerified) {
      router.push("/verify-email?pending=true");
      return;
    }
    router.push("/checkout");
  }

  if (!isHydrated || loading) {
    return <div className="mx-auto max-w-5xl px-4 py-20 text-center text-slate-400">Loading your cart...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          description="Looks like you haven't added anything to your cart yet. Start shopping to fill it up with bulk deals."
          actionLabel="Browse products"
          actionHref="/shop"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-extrabold text-slate-900 sm:text-3xl">Your Cart</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-4 p-4 sm:p-6">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-50 sm:h-24 sm:w-24">
                  <Image
                    src={item.image || "/images/products/placeholder.jpg"}
                    alt={item.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between gap-4">
                    <div>
                      <Link href={`/shop/${item.slug}`} className="text-sm font-semibold text-slate-900 hover:underline">
                        {item.name}
                      </Link>
                      <p className="mt-1 text-xs text-slate-400">{formatCurrency(item.price)} each</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-slate-200">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center text-slate-600 hover:text-slate-900"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center text-slate-600 hover:text-slate-900"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link href="/shop" className="mt-4 inline-block text-sm font-semibold text-blue-900 hover:underline">
            ← Continue shopping
          </Link>
        </div>

        <div className="h-fit rounded-2xl border border-slate-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Order Summary</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Bulk discount (5% over $300)</span>
              <span>-{formatCurrency(bulkDiscount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span>{shippingFee === 0 ? "Free" : formatCurrency(shippingFee)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            className="mt-6 w-full rounded-full bg-blue-900 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            Proceed to checkout
          </button>
          {!user && (
            <p className="mt-3 text-center text-xs text-slate-400">
              You&apos;ll need to log in or create an account to checkout.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
