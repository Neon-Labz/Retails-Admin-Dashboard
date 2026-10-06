"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Bell, LogOut, UserCircle, Settings, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface HeaderProps {
  onMenuClick: () => void;
  admin: { name: string; email: string; role: string } | null;
}

const LABELS: Record<string, string> = {
  dashboard: "Overview",
  products: "Products",
  categories: "Categories",
  orders: "Orders",
  stock: "Stock & Inventory",
  customers: "Customers",
  payments: "Payments",
  notifications: "Notifications",
  settings: "Settings",
  profile: "Admin Profile",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = (pathname || "").split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-1.5 text-sm text-slate-500">
      <Link href="/dashboard" className="hover:text-slate-700">
        Home
      </Link>
      {segments.map((seg, idx) => {
        const href = "/" + segments.slice(0, idx + 1).join("/");
        const label = LABELS[seg] || seg;
        const isLast = idx === segments.length - 1;
        return (
          <span key={href} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            {isLast ? (
              <span className="font-medium text-slate-700">{label}</span>
            ) : (
              <Link href={href} className="hover:text-slate-700 capitalize">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function Header({ onMenuClick, admin }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadUnread() {
      try {
        const res = await fetch("/api/notifications?unreadOnly=true&limit=1");
        const json = await res.json();
        if (active && json.success) setUnread(json.data.meta.total);
      } catch {
        /* ignore */
      }
    }
    loadUnread();
    const interval = setInterval(loadUnread, 20000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Logged out successfully");
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <Link href="/dashboard/notifications" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
              {admin?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-slate-800 leading-tight">{admin?.name || "Admin"}</p>
              <p className="text-xs text-slate-400 leading-tight capitalize">{admin?.role?.replace("_", " ") || ""}</p>
            </div>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg">
              <Link
                href="/dashboard/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                <UserCircle className="h-4 w-4" /> Profile
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                <Settings className="h-4 w-4" /> Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
