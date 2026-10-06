import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Order, OrderItem } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/checkout/success/${orderNumber}`);

  const order: any = await Order.findOne({ orderNumber }).lean();
  if (!order || order.userId.toString() !== user.id) notFound();

  const items: any[] = await OrderItem.find({ orderId: order._id }).lean();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">✅</div>
        <h1 className="mt-5 text-2xl font-extrabold text-slate-900 sm:text-3xl">Order confirmed!</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Thanks for your order, {user.name}. We&apos;ve sent a confirmation email with your receipt to{" "}
          <strong>{order.customerEmail}</strong>.
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-slate-100 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Order number</p>
            <p className="text-lg font-bold text-slate-900">{order.orderNumber}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-400">Order date</p>
            <p className="font-medium text-slate-800">{formatDateTime(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Payment method</p>
            <p className="font-medium capitalize text-slate-800">{order.paymentMethod.replace(/_/g, " ")}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Total</p>
            <p className="font-bold text-slate-900">{formatCurrency(order.total)}</p>
          </div>
        </div>

        <div className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
          {items.map((item) => (
            <div key={item._id.toString()} className="flex items-center justify-between py-3 text-sm">
              <span className="text-slate-700">
                {item.name} × {item.quantity}
              </span>
              <span className="font-semibold text-slate-900">{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-1 border-t border-slate-100 pt-4 text-sm">
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
          <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href={`/dashboard/orders/${order.orderNumber}`}
          className="rounded-full bg-blue-900 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-800"
        >
          View order details
        </Link>
        <Link
          href="/shop"
          className="rounded-full border border-slate-200 px-6 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
