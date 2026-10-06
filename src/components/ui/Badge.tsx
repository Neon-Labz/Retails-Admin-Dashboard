import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/utils";

export function OrderStatusBadge({ status }: { status: string }) {
  const key = (status as OrderStatus) in ORDER_STATUS_LABELS ? (status as OrderStatus) : "pending";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${ORDER_STATUS_COLORS[key]}`}
    >
      {ORDER_STATUS_LABELS[key]}
    </span>
  );
}

export function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ${className}`}>
      {children}
    </span>
  );
}
