"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop?featured=true", label: "Featured" },
];

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [search, setSearch] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = search.trim();
    router.push(query ? `/shop?search=${encodeURIComponent(query)}` : "/shop");
    setMenuOpen(false);
  }

  async function handleLogout() {
    await logout();
    setAccountOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-900 text-lg font-bold text-white">
            B
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">BulkMart</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-600 hover:text-blue-900">
              {link.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="hidden flex-1 items-center md:flex">
          <div className="relative w-full max-w-md">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="search"
              placeholder="Search bulk products..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-700 focus:bg-white"
            />
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-3">
          <Link href="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>

          {!loading && !user && (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Log in
              </Link>
              <Link href="/register" className="rounded-full bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                Sign up
              </Link>
            </div>
          )}

          {!loading && user && (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-slate-200 py-1.5 pl-1.5 pr-3 hover:bg-slate-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-900">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[100px] truncate text-sm font-medium text-slate-700">{user.name}</span>
              </button>
              {accountOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg"
                  onMouseLeave={() => setAccountOpen(false)}
                >
                  <Link href="/dashboard" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setAccountOpen(false)}>
                    Dashboard
                  </Link>
                  <Link href="/dashboard/orders" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setAccountOpen(false)}>
                    My Orders
                  </Link>
                  <Link href="/dashboard/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setAccountOpen(false)}>
                    Profile
                  </Link>
                  <button onClick={handleLogout} className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 lg:hidden"
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-2 lg:hidden">
          <form onSubmit={handleSearch} className="mb-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="search"
              placeholder="Search bulk products..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-700"
            />
          </form>
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
            {!loading && !user && (
              <div className="mt-2 flex gap-2">
                <Link href="/login" onClick={() => setMenuOpen(false)} className="flex-1 rounded-full border border-slate-200 py-2 text-center text-sm font-semibold">
                  Log in
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="flex-1 rounded-full bg-blue-900 py-2 text-center text-sm font-semibold text-white">
                  Sign up
                </Link>
              </div>
            )}
            {!loading && user && (
              <div className="mt-2 flex flex-col gap-1 border-t border-slate-100 pt-2">
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Dashboard
                </Link>
                <Link href="/dashboard/orders" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  My Orders
                </Link>
                <button onClick={handleLogout} className="rounded-lg px-2 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50">
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
