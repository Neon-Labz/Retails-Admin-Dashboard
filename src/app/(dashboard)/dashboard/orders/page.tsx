"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, ShoppingCart } from "lucide-react";
import { Button, Badge, Card, Select, Textarea } from "@/components/ui/primitives";
import { DataTable, type Column, Pagination, SearchInput } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";

interface OrderRow {
  _id: string;
  orderNumber: string;
  customerSnapshot: { name: string; email: string; phone?: string };
  items: Array<{ name: string; image?: string; price: number; quantity: number; subtotal: number }>;
  billingAddress: Record<string, string>;
  shippingAddress: Record<string, string>;
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  paymentStatus: string;
  paymentMethod: string;
  status: string;
  statusHistory: Array<{ status: string; changedAt: string; note?: string }>;
  notes?: string;
  createdAt: string;
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

const paymentColors: Record<string, "yellow" | "green" | "red" | "slate"> = {
  pending: "yellow",
  paid: "green",
  failed: "red",
  refunded: "slate",
};

export default function OrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });

  const [detail, setDetail] = useState<OrderRow | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (paymentStatus) params.set("paymentStatus", paymentStatus);
      params.set("page", String(page));
      params.set("limit", "10");
      const res = await fetch(`/api/orders?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data.orders);
        setMeta(json.data.meta);
      }
    } finally {
      setLoading(false);
    }
  }, [search, status, paymentStatus, page]);

  useEffect(() => {
    load();
  }, [load]);

  function openDetail(order: OrderRow) {
    setDetail(order);
    setNewStatus(order.status);
    setNote("");
  }

  async function handleUpdateStatus() {
    if (!detail) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${detail._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Failed to update status");
        return;
      }
      toast.success("Order status updated successfully");
      setDetail(json.data);
      load();
    } finally {
      setUpdating(false);
    }
  }

  const columns: Column<OrderRow>[] = useMemo(
    () => [
      {
        header: "Order",
        key: "orderNumber",
        render: (o) => (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-slate-800">{o.orderNumber}</p>
              <p className="text-xs text-slate-400">{o.items.length} item(s)</p>
            </div>
          </div>
        ),
      },
      {
        header: "Customer",
        key: "customer",
        render: (o) => (
          <div>
            <p className="text-slate-700">{o.customerSnapshot?.name}</p>
            <p className="text-xs text-slate-400">{o.customerSnapshot?.email}</p>
          </div>
        ),
      },
      { header: "Total", key: "total", render: (o) => formatCurrency(o.total) },
      { header: "Payment", key: "paymentStatus", render: (o) => <Badge color={paymentColors[o.paymentStatus] || "slate"}>{o.paymentStatus}</Badge> },
      { header: "Status", key: "status", render: (o) => <Badge color={statusColors[o.status] || "slate"}>{o.status}</Badge> },
      { header: "Date", key: "createdAt", render: (o) => formatDateTime(o.createdAt) },
      {
        header: "Actions",
        key: "actions",
        render: (o) => (
          <button onClick={() => openDetail(o)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600">
            <Eye className="h-4 w-4" />
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">Track, filter and manage all customer orders.</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search order number or customer..." />
          <div className="flex flex-wrap gap-2">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500">
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500">
              <option value="">All payments</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <DataTable columns={columns} data={orders} loading={loading} emptyTitle="No orders found" emptyDescription="Orders placed by customers will appear here." />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Order ${detail.orderNumber}` : ""} size="xl">
        {detail && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Customer</p>
                <p className="text-sm font-medium text-slate-800">{detail.customerSnapshot?.name}</p>
                <p className="text-sm text-slate-500">{detail.customerSnapshot?.email}</p>
                <p className="text-sm text-slate-500">{detail.customerSnapshot?.phone}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Shipping Address</p>
                <p className="text-sm text-slate-600">
                  {[detail.shippingAddress?.line1, detail.shippingAddress?.city, detail.shippingAddress?.state, detail.shippingAddress?.country]
                    .filter(Boolean)
                    .join(", ") || "Not provided"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase text-slate-500">
                    <th className="px-4 py-2.5">Product</th>
                    <th className="px-4 py-2.5">Price</th>
                    <th className="px-4 py-2.5">Qty</th>
                    <th className="px-4 py-2.5">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-2.5 text-slate-700">{item.name}</td>
                      <td className="px-4 py-2.5 text-slate-500">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-2.5 text-slate-500">{item.quantity}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-700">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(detail.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Discount</span>
                <span>-{formatCurrency(detail.discount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping</span>
                <span>{formatCurrency(detail.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span>{formatCurrency(detail.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(detail.total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
              <Select label="Update order status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <div className="flex items-end">
                <Button onClick={handleUpdateStatus} loading={updating} className="w-full">
                  Update status
                </Button>
              </div>
              <Textarea label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="sm:col-span-2" />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Status history</p>
              <div className="flex flex-col gap-2">
                {detail.statusHistory
                  ?.slice()
                  .reverse()
                  .map((h, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge color={statusColors[h.status] || "slate"}>{h.status}</Badge>
                        {h.note && <span className="text-xs text-slate-500">{h.note}</span>}
                      </div>
                      <span className="text-xs text-slate-400">{formatDateTime(h.changedAt)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
