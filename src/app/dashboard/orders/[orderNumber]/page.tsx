import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Order, OrderItem } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDateTime, ORDER_STATUS_LABELS } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

const TRACKING_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const order: any = await Order.findOne({ orderNumber }).lean();
  if (!order || order.userId.toString() !== user.id) notFound();

  const items: any[] = await OrderItem.find({ orderId: order._id }).lean();

  const billing = order.billingAddress as Record<string, string>;
  const shipping = order.shippingAddress as Record<string, string>;
  const isCancelled = order.status === "cancelled";
  const currentStepIndex = TRACKING_STEPS.indexOf(order.status as (typeof TRACKING_STEPS)[number]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/orders" className="text-xs font-semibold text-blue-900 hover:underline">
            ← Back to orders
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">{order.orderNumber}</h1>
          <p className="text-sm text-slate-500">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <a
          href={`/api/orders/${order.orderNumber}/receipt`}
          className="flex items-center gap-2 rounded-full bg-blue-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
        >
          ⬇ Download receipt
        </a>
      </div>

      {/* Tracking */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Order status</h2>
          <OrderStatusBadge status={order.status} />
        </div>

        {isCancelled ? (
          <p className="text-sm text-rose-600">This order was cancelled.</p>
        ) : (
          <div className="flex items-center">
            {TRACKING_STEPS.map((step, idx) => {
              const reached = idx <= currentStepIndex;
              const isLast = idx === TRACKING_STEPS.length - 1;
              return (
                <div key={step} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        reached ? "bg-blue-900 text-white" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className={`text-[11px] font-medium ${reached ? "text-slate-900" : "text-slate-400"}`}>
                      {ORDER_STATUS_LABELS[step]}
                    </span>
                  </div>
                  {!isLast && (
                    <div className={`mx-2 h-0.5 flex-1 ${idx < currentStepIndex ? "bg-blue-900" : "bg-slate-100"}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Items</h2>
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                    <Image
                      src={item.image || "/images/products/placeholder.jpg"}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(item.lineTotal)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-1.5 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>{formatCurrency(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Payment</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Method</dt>
                <dd className="font-medium capitalize text-slate-800">{order.paymentMethod.replace(/_/g, " ")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-medium capitalize text-slate-800">{order.paymentStatus}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Billing address</h2>
            <p className="text-sm text-slate-700">{billing.fullName}</p>
            <p className="text-sm text-slate-500">{billing.line1} {billing.line2}</p>
            <p className="text-sm text-slate-500">{billing.city}, {billing.state} {billing.postalCode}</p>
            <p className="text-sm text-slate-500">{billing.country}</p>
            <p className="mt-1 text-sm text-slate-500">{billing.phone}</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Shipping address</h2>
            <p className="text-sm text-slate-700">{shipping.fullName}</p>
            <p className="text-sm text-slate-500">{shipping.line1} {shipping.line2}</p>
            <p className="text-sm text-slate-500">{shipping.city}, {shipping.state} {shipping.postalCode}</p>
            <p className="text-sm text-slate-500">{shipping.country}</p>
            <p className="mt-1 text-sm text-slate-500">{shipping.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
