import Link from "next/link";
import { Order } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [recentOrders, stats] = await Promise.all([
    Order.find({ userId: user.id }).sort({ createdAt: -1 }).limit(5).lean(),
    Order.find({ userId: user.id }).lean(),
  ]);

  const summary = { totalOrders: stats.length, totalSpent: stats.reduce((n: number, o: any) => n + Number(o.total || 0), 0), pendingOrders: stats.filter((o: any) => ["pending", "confirmed", "processing", "shipped"].includes(o.status)).length };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900">Welcome back, {user.name.split(" ")[0]} 👋</h1>
      <p className="mt-1 text-sm text-slate-500">Here&apos;s an overview of your BulkMart account.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total orders" value={String(summary.totalOrders)} icon="📦" />
        <StatCard label="Active orders" value={String(summary.pendingOrders)} icon="🚚" />
        <StatCard label="Total spent" value={formatCurrency(summary.totalSpent)} icon="💳" />
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent orders</h2>
          <Link href="/dashboard/orders" className="text-sm font-semibold text-blue-900 hover:underline">
            View all →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <EmptyState
            icon="🛍️"
            title="No orders yet"
            description="Once you place an order, it will show up here."
            actionLabel="Start shopping"
            actionHref="/shop"
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={String(order._id)} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/orders/${order.orderNumber}`} className="font-semibold text-blue-900 hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}
