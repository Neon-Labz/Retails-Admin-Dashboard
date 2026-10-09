"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, ShieldCheck, ShieldOff, UserRound } from "lucide-react";
import { Button, Badge, Card, Switch } from "@/components/ui/primitives";
import { DataTable, type Column, Pagination, SearchInput } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

interface CustomerRow {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isVerified: boolean;
  isActive: boolean;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

interface OrderSummary {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
}

function CustomersContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const querySearch = searchParams.get("search") || "";
  const queryCustomerId = searchParams.get("customerId") || "";

  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(querySearch);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });

  const [detail, setDetail] = useState<CustomerRow | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const autoOpenedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "10");
      const res = await fetch(`/api/customers?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data.customers);
        setMeta(json.data.meta);
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-open customer modal if navigated with customerId or specific search
  useEffect(() => {
    if (queryCustomerId && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      (async () => {
        setDetailLoading(true);
        try {
          const res = await fetch(`/api/customers/${queryCustomerId}`);
          const json = await res.json();
          if (json.success && json.data.customer) {
            setDetail(json.data.customer);
            setOrders(json.data.orders || []);
          }
        } catch {
          /* ignore */
        } finally {
          setDetailLoading(false);
        }
      })();
    }
  }, [queryCustomerId]);

  useEffect(() => {
    if (!queryCustomerId && querySearch && !autoOpenedRef.current && customers.length > 0) {
      autoOpenedRef.current = true;
      openDetail(customers[0]);
    }
  }, [customers, queryCustomerId, querySearch]);

  async function openDetail(customer: CustomerRow) {
    setDetail(customer);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer._id}`);
      const json = await res.json();
      if (json.success) setOrders(json.data.orders);
    } finally {
      setDetailLoading(false);
    }
  }

  async function toggleStatus(customer: CustomerRow, isActive: boolean) {
    try {
      const res = await fetch(`/api/customers/${customer._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Failed to update customer");
        return;
      }
      toast.success(json.message);
      load();
      if (detail?._id === customer._id) setDetail({ ...detail, isActive });
    } catch {
      toast.error("Something went wrong");
    }
  }

  const columns: Column<CustomerRow>[] = useMemo(
    () => [
      {
        header: "Customer",
        key: "name",
        render: (c) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-slate-800">{c.name}</p>
              <p className="text-xs text-slate-400">{c.email}</p>
            </div>
          </div>
        ),
      },
      { header: "Phone", key: "phone", render: (c) => c.phone || "-" },
      { header: "Orders", key: "totalOrders" },
      { header: "Total Spent", key: "totalSpent", render: (c) => formatCurrency(c.totalSpent) },
      { header: "Verified", key: "isVerified", render: (c) => <Badge color={c.isVerified ? "green" : "yellow"}>{c.isVerified ? "Verified" : "Unverified"}</Badge> },
      { header: "Status", key: "isActive", render: (c) => <Badge color={c.isActive ? "green" : "red"}>{c.isActive ? "Active" : "Suspended"}</Badge> },
      { header: "Joined", key: "createdAt", render: (c) => formatDate(c.createdAt) },
      {
        header: "Actions",
        key: "actions",
        render: (c) => (
          <div className="flex items-center gap-1">
            <button onClick={() => openDetail(c)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand">
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => toggleStatus(c, !c.isActive)}
              title={c.isActive ? "Suspend account" : "Activate account"}
              className={`rounded-lg p-2 hover:bg-slate-100 ${c.isActive ? "text-rose-500" : "text-emerald-500"}`}
            >
              {c.isActive ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [detail]
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Customers</h1>
        <p className="mt-0.5 text-xs sm:text-sm text-slate-500">View and manage registered customers.</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput className="flex-1 w-full" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name, email or phone..." />
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {[
              { key: "", label: "All" },
              { key: "active", label: "Active" },
              { key: "inactive", label: "Suspended" },
              { key: "verified", label: "Verified" },
              { key: "unverified", label: "Unverified" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => { setStatusFilter(opt.key); setPage(1); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === opt.key ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <DataTable columns={columns} data={customers} loading={loading} emptyTitle="No customers found" emptyDescription="Registered customers will appear here." />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} size="lg">
        {detail && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-xl font-semibold text-brand">
                {detail.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{detail.name}</p>
                <p className="text-sm text-slate-500">{detail.email}</p>
                <p className="text-sm text-slate-500">{detail.phone || "No phone on file"}</p>
              </div>
              <Switch checked={detail.isActive} onChange={(v) => toggleStatus(detail, v)} label="Account active" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xs text-slate-400">Orders</p>
                <p className="text-lg font-semibold text-slate-800">{detail.totalOrders}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xs text-slate-400">Total Spent</p>
                <p className="text-lg font-semibold text-slate-800">{formatCurrency(detail.totalSpent)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xs text-slate-400">Verification</p>
                <Badge color={detail.isVerified ? "green" : "yellow"}>{detail.isVerified ? "Verified" : "Unverified"}</Badge>
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400">
                <UserRound className="h-3.5 w-3.5" /> Order history
              </p>
              {detailLoading ? (
                <p className="py-6 text-center text-sm text-slate-400">Loading orders...</p>
              ) : orders.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">No orders placed yet</p>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {orders.map((o) => (
                    <div key={o._id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="font-medium text-slate-700">{o.orderNumber}</span>
                      <span className="text-slate-500">{formatCurrency(o.total)}</span>
                      <Badge color="blue">{o.status}</Badge>
                      <span className="text-xs text-slate-400">{formatDateTime(o.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={null}>
      <CustomersContent />
    </Suspense>
  );
}
