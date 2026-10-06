"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatCurrency } from "@/lib/utils";

type AddressForm = {
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const EMPTY_ADDRESS: AddressForm = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
};

const PAYMENT_METHODS = [
  { value: "cash_on_delivery", label: "Cash on Delivery" },
  { value: "card_on_delivery", label: "Card on Delivery" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, isHydrated } = useCart();
  const { user, loading } = useAuth();

  const [billing, setBilling] = useState<AddressForm>(EMPTY_ADDRESS);
  const [shipping, setShipping] = useState<AddressForm>(EMPTY_ADDRESS);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setBilling((b) => ({ ...b, fullName: b.fullName || user.name, phone: b.phone || user.phone || "" }));
    }
  }, [user]);

  useEffect(() => {
    if (!isHydrated || loading) return;
    if (!user) {
      router.replace("/login?redirect=/checkout");
      return;
    }
    if (!user.emailVerified) {
      router.replace("/verify-email?pending=true");
      return;
    }
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [isHydrated, loading, user, items.length, router]);

  const freeShippingThreshold = 100;
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 9.99;
  const bulkDiscount = subtotal >= 300 ? Number((subtotal * 0.05).toFixed(2)) : 0;
  const total = Number((subtotal - bulkDiscount + shippingFee).toFixed(2));

  function updateBilling(key: keyof AddressForm, value: string) {
    setBilling((b) => ({ ...b, [key]: value }));
  }
  function updateShipping(key: keyof AddressForm, value: string) {
    setShipping((s) => ({ ...s, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!billing.fullName || !billing.phone || !billing.line1 || !billing.city || !billing.state || !billing.postalCode) {
      setError("Please complete all required billing fields.");
      return;
    }
    if (!sameAsBilling && (!shipping.fullName || !shipping.line1 || !shipping.city || !shipping.state || !shipping.postalCode)) {
      setError("Please complete all required shipping fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          billingAddress: billing,
          shippingAddress: sameAsBilling ? billing : shipping,
          sameAsBilling,
          paymentMethod,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to place order");
        return;
      }
      clearCart();
      router.push(`/checkout/success/${data.order.orderNumber}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isHydrated || loading || !user || items.length === 0) {
    return <div className="mx-auto max-w-5xl px-4 py-20 text-center text-slate-400">Loading checkout...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-extrabold text-slate-900 sm:text-3xl">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-2xl border border-slate-100 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Billing details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name" value={billing.fullName} onChange={(v) => updateBilling("fullName", v)} required />
              <Field label="Phone number" value={billing.phone} onChange={(v) => updateBilling("phone", v)} required />
              <Field label="Address line 1" value={billing.line1} onChange={(v) => updateBilling("line1", v)} required className="sm:col-span-2" />
              <Field label="Address line 2 (optional)" value={billing.line2} onChange={(v) => updateBilling("line2", v)} className="sm:col-span-2" />
              <Field label="City" value={billing.city} onChange={(v) => updateBilling("city", v)} required />
              <Field label="State / Province" value={billing.state} onChange={(v) => updateBilling("state", v)} required />
              <Field label="Postal code" value={billing.postalCode} onChange={(v) => updateBilling("postalCode", v)} required />
              <Field label="Country" value={billing.country} onChange={(v) => updateBilling("country", v)} required />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Shipping details</h2>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-700"
                />
                Same as billing
              </label>
            </div>
            {!sameAsBilling && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full name" value={shipping.fullName} onChange={(v) => updateShipping("fullName", v)} required />
                <Field label="Phone number" value={shipping.phone} onChange={(v) => updateShipping("phone", v)} required />
                <Field label="Address line 1" value={shipping.line1} onChange={(v) => updateShipping("line1", v)} required className="sm:col-span-2" />
                <Field label="Address line 2 (optional)" value={shipping.line2} onChange={(v) => updateShipping("line2", v)} className="sm:col-span-2" />
                <Field label="City" value={shipping.city} onChange={(v) => updateShipping("city", v)} required />
                <Field label="State / Province" value={shipping.state} onChange={(v) => updateShipping("state", v)} required />
                <Field label="Postal code" value={shipping.postalCode} onChange={(v) => updateShipping("postalCode", v)} required />
                <Field label="Country" value={shipping.country} onChange={(v) => updateShipping("country", v)} required />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Payment method</h2>
            <div className="flex flex-col gap-2">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                    paymentMethod === method.value ? "border-blue-900 bg-blue-50" : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value)}
                    className="h-4 w-4 text-blue-900 focus:ring-blue-700"
                  />
                  {method.label}
                </label>
              ))}
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">Order notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-700"
                placeholder="Delivery instructions, gift notes, etc."
              />
            </div>
          </section>
        </div>

        <div className="h-fit rounded-2xl border border-slate-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Order Summary</h2>
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                  <Image src={item.image || "/images/products/placeholder.jpg"} alt={item.name} fill sizes="48px" className="object-cover" />
                </div>
                <div className="flex-1 text-xs">
                  <p className="font-semibold text-slate-800 line-clamp-1">{item.name}</p>
                  <p className="text-slate-400">Qty {item.quantity}</p>
                </div>
                <span className="text-xs font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 py-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Bulk discount</span>
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

          {error && <div className="mb-3 rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-blue-900 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
          >
            {submitting ? "Placing order..." : "Place order"}
          </button>
          <Link href="/cart" className="mt-3 block text-center text-xs font-semibold text-slate-500 hover:underline">
            Back to cart
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-700"
      />
    </div>
  );
}
