"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import type { SessionUser } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "🏠" },
  { href: "/dashboard/orders", label: "My Orders", icon: "📦" },
  { href: "/dashboard/profile", label: "Profile", icon: "👤" },
  { href: "/dashboard/addresses", label: "Addresses", icon: "📍" },
];

export function DashboardSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-base font-bold text-blue-900">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-blue-900 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            <span>🚪</span>
            Log out
          </button>
        </nav>
      </div>
    </aside>
  );
}
