import Link from "next/link";
import { Order, OrderItem } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const allOrders = await Order.find({ userId: user.id }).sort({ createdAt: -1 }).lean();
  const withCounts = await Promise.all(allOrders.map(async (o: any) => ({ ...o, id: o._id.toString(), itemCount: await OrderItem.countDocuments({ orderId: o._id }) })));

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900">My Orders</h1>
      <p className="mt-1 text-sm text-slate-500">Track and manage all of your BulkMart orders.</p>

      <div className="mt-8">
        {allOrders.length === 0 ? (
          <EmptyState
            icon="🛍️"
            title="No orders yet"
            description="Once you place an order, it will show up here with real-time status tracking."
            actionLabel="Start shopping"
            actionHref="/shop"
          />
        ) : (
          <div className="flex flex-col gap-4">
            {            withCounts.map((order: any) => (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.orderNumber}`}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(order.createdAt)} · {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <OrderStatusBadge status={order.status} />
                  <span className="font-bold text-slate-900">{formatCurrency(order.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
