"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-lg font-bold text-white">
              B
            </span>
            <span className="text-lg font-extrabold text-white">BulkMart</span>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            We buy in bulk directly from trusted suppliers and pass the savings on to you —
            quality products, wholesale prices.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white">Shop</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/shop" className="hover:text-white">All Products</Link></li>
            <li><Link href="/shop?featured=true" className="hover:text-white">Featured</Link></li>
            <li><Link href="/shop?sort=newest" className="hover:text-white">New Arrivals</Link></li>
            <li><Link href="/cart" className="hover:text-white">Your Cart</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white">Account</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/login" className="hover:text-white">Log in</Link></li>
            <li><Link href="/register" className="hover:text-white">Create account</Link></li>
            <li><Link href="/dashboard/orders" className="hover:text-white">Track order</Link></li>
            <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white">Stay in the loop</h4>
          <p className="mt-4 text-sm text-slate-400">Get notified about new bulk deals and restocks.</p>
          <form className="mt-3 flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="you@email.com"
              className="w-full min-w-0 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-600"
            />
            <button className="shrink-0 rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">
              Join
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} BulkMart. All rights reserved.
      </div>
    </footer>
  );
}
