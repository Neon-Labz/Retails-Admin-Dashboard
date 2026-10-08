import { headers } from "next/headers";
import Link from "next/link";
import {
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  Boxes,
  AlertTriangle,
  XCircle,
  Clock,
  CheckCircle2,
  Ban,
} from "lucide-react";
import { Card, StatCard, Badge } from "@/components/ui/primitives";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { SalesTrendChart, OrderStatusPieChart, CategoryBarChart } from "./overview-charts";

export const dynamic = "force-dynamic";

interface DashboardStats {
  totals: {
    totalProducts: number;
    totalCustomers: number;
    totalOrders: number;
    totalSales: number;
    availableStock: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
  };
  ordersByStatus: { status: string; count: number }[];
  salesByDay: { _id: string; sales: number; orders: number }[];
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    customerSnapshot: { name: string; email: string };
    total: number;
    status: string;
    createdAt: string;
  }>;
  recentCustomers: Array<{ _id: string; name: string; email: string; createdAt: string }>;
  topCategories: { name: string; productCount: number; totalStock: number }[];
}

async function getStats(): Promise<DashboardStats | null> {
  try {
    const hdrs = await headers();
    const host = hdrs.get("host");
    const protocol = host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https";
    const cookie = hdrs.get("cookie") || "";
    const res = await fetch(`${protocol}://${host}/api/dashboard/stats`, { cache: "no-store", headers: { cookie } });
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

const statusColors: Record<string, "yellow" | "blue" | "purple" | "green" | "red" | "slate"> = {
  pending: "yellow",
  confirmed: "blue",
  processing: "purple",
  shipped: "blue",
  delivered: "green",
  cancelled: "red",
  refunded: "slate",
};

export default async function DashboardOverviewPage() {
  const stats = await getStats();

  if (!stats) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-slate-400">
        Unable to load dashboard statistics right now.
      </div>
    );
  }

  const { totals } = stats;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-slate-500">A quick summary of your store&apos;s performance.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Sales" value={formatCurrency(totals.totalSales)} icon={<DollarSign className="h-4.5 w-4.5" />} color="emerald" />
        <StatCard label="Total Orders" value={totals.totalOrders} icon={<ShoppingCart className="h-4.5 w-4.5" />} color="indigo" />
        <StatCard label="Total Products" value={totals.totalProducts} icon={<Package className="h-4.5 w-4.5" />} color="sky" />
        <StatCard label="Total Customers" value={totals.totalCustomers} icon={<Users className="h-4.5 w-4.5" />} color="violet" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending Orders" value={totals.pendingOrders} icon={<Clock className="h-4.5 w-4.5" />} color="amber" />
        <StatCard label="Completed Orders" value={totals.completedOrders} icon={<CheckCircle2 className="h-4.5 w-4.5" />} color="emerald" />
        <StatCard label="Cancelled Orders" value={totals.cancelledOrders} icon={<Ban className="h-4.5 w-4.5" />} color="rose" />
        <StatCard label="Available Stock" value={totals.availableStock} icon={<Boxes className="h-4.5 w-4.5" />} color="cyan" />
      </div>

      {(totals.lowStockProducts > 0 || totals.outOfStockProducts > 0) && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {totals.lowStockProducts > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200/90 bg-[#FFFBEB] px-5 py-4 text-sm text-amber-900 shadow-[0_2px_10px_rgba(245,158,11,0.05)]">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
              <p>
                <strong>{totals.lowStockProducts}</strong> product(s) are running low on stock.{" "}
                <Link href="/dashboard/stock" className="font-semibold underline underline-offset-2 hover:text-amber-950">
                  Review stock
                </Link>
              </p>
            </div>
          )}
          {totals.outOfStockProducts > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-200/90 bg-[#FFF1F2] px-5 py-4 text-sm text-rose-900 shadow-[0_2px_10px_rgba(244,63,94,0.05)]">
              <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
              <p>
                <strong>{totals.outOfStockProducts}</strong> product(s) are out of stock.{" "}
                <Link href="/dashboard/stock" className="font-semibold underline underline-offset-2 hover:text-rose-950">
                  Restock now
                </Link>
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Sales Trend (Last 14 days)</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
              <span>Daily Revenue</span>
            </div>
          </div>
          <SalesTrendChart data={stats.salesByDay} />
        </Card>
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Orders by Status</h3>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <span className="text-lg font-bold tracking-widest leading-none">•••</span>
            </button>
          </div>
          <OrderStatusPieChart data={stats.ordersByStatus} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h3 className="text-sm font-semibold text-slate-700">Recent Orders</h3>
            <Link href="/dashboard/orders" className="text-xs font-medium text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-xs uppercase text-slate-500">
                  <th className="px-5 py-2.5 font-semibold">Order</th>
                  <th className="px-5 py-2.5 font-semibold">Customer</th>
                  <th className="px-5 py-2.5 font-semibold">Total</th>
                  <th className="px-5 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                      No orders yet
                    </td>
                  </tr>
                )}
                {stats.recentOrders.map((order) => (
                  <tr key={order._id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-medium text-slate-800">{order.orderNumber}</td>
                    <td className="px-5 py-3 text-slate-600">{order.customerSnapshot?.name}</td>
                    <td className="px-5 py-3 text-slate-600">{formatCurrency(order.total)}</td>
                    <td className="px-5 py-3">
                      <Badge color={statusColors[order.status] || "slate"}>{order.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h3 className="text-sm font-semibold text-slate-700">Recent Customers</h3>
            <Link href="/dashboard/customers" className="text-xs font-medium text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.recentCustomers.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">No customers yet</p>}
            {stats.recentCustomers.map((c) => (
              <div key={c._id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{c.name}</p>
                  <p className="truncate text-xs text-slate-400">{c.email}</p>
                </div>
                <p className="shrink-0 text-xs text-slate-400">{formatDateTime(c.createdAt)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-700">Products per Category</h3>
        <CategoryBarChart data={stats.topCategories} />
      </Card>
    </div>
  );
}
