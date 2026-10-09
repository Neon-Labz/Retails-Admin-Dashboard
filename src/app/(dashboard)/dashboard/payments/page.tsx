"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreditCard, Eye, ChevronDown, Check, X } from "lucide-react";
import { Button, Badge, Card, Select } from "@/components/ui/primitives";
import { DataTable, type Column, Pagination, SearchInput } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";
import { PAYMENT_METHODS, PAYMENT_RECORD_STATUSES } from "@/lib/constants";

interface PaymentRow {
  _id: string;
  orderNumber: string;
  customer: { name: string; email: string } | null;
  amount: number;
  method: string;
  status: string;
  transactionId?: string;
  gateway: string;
  paidAt?: string;
  createdAt: string;
}

const statusColors: Record<string, "yellow" | "green" | "red" | "slate"> = {
  pending: "yellow",
  completed: "green",
  failed: "red",
  refunded: "slate",
};

export default function PaymentsPage() {
  const toast = useToast();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const [methodMenuOpen, setMethodMenuOpen] = useState(false);
  const methodMenuRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });
  const [detail, setDetail] = useState<PaymentRow | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
      if (methodMenuRef.current && !methodMenuRef.current.contains(e.target as Node)) {
        setMethodMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (method) params.set("method", method);
      params.set("page", String(page));
      params.set("limit", "10");
      const res = await fetch(`/api/payments?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setPayments(json.data.payments);
        setMeta(json.data.meta);
      }
    } finally {
      setLoading(false);
    }
  }, [search, status, method, page]);

  useEffect(() => {
    load();
  }, [load]);

  function openDetail(payment: PaymentRow) {
    setDetail(payment);
    setNewStatus(payment.status);
    setTransactionId(payment.transactionId || "");
  }

  async function handleUpdate() {
    if (!detail) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/payments/${detail._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, transactionId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Failed to update payment");
        return;
      }
      toast.success("Payment updated successfully");
      setDetail(null);
      load();
    } finally {
      setUpdating(false);
    }
  }

  const columns: Column<PaymentRow>[] = useMemo(
    () => [
      {
        header: "Order",
        key: "orderNumber",
        render: (p) => (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
              <CreditCard className="h-4 w-4" />
            </div>
            <span className="font-medium text-slate-800">{p.orderNumber}</span>
          </div>
        ),
      },
      { header: "Customer", key: "customer", render: (p) => p.customer?.name || "-" },
      { header: "Amount", key: "amount", render: (p) => formatCurrency(p.amount) },
      { header: "Method", key: "method", render: (p) => <Badge color="blue">{p.method.replace("_", " ")}</Badge> },
      { header: "Status", key: "status", render: (p) => <Badge color={statusColors[p.status] || "slate"}>{p.status}</Badge> },
      { header: "Date", key: "createdAt", render: (p) => formatDateTime(p.createdAt) },
      {
        header: "Actions",
        key: "actions",
        render: (p) => (
          <button onClick={() => openDetail(p)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand">
            <Eye className="h-4 w-4" />
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Payments</h1>
        <p className="mt-0.5 text-xs sm:text-sm text-slate-500">Track payment status and transaction details for every order.</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput className="flex-1 w-full" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search order number..." />
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Status Filter */}
            <div className="relative" ref={statusMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setMethodMenuOpen(false);
                  setStatusMenuOpen((v) => !v);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm outline-none transition cursor-pointer select-none shadow-xs",
                  status
                    ? "border-brand bg-brand-light/40 text-brand font-medium"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                )}
                title="Filter by status"
              >
                <span className="capitalize">{status ? status : "All statuses"}</span>
                {status ? (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatus("");
                      setPage(1);
                    }}
                    className="ml-0.5 rounded p-0.5 hover:bg-brand/10 text-brand transition cursor-pointer"
                    title="Clear status filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </span>
                ) : null}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                    status ? "text-brand" : "text-slate-400",
                    statusMenuOpen && "rotate-180"
                  )}
                />
              </button>

              {statusMenuOpen && (
                <div className="absolute right-0 top-full z-30 mt-1.5 w-44 rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-xl shadow-slate-900/10 animate-modal-in">
                  <button
                    type="button"
                    onClick={() => {
                      setStatus("");
                      setPage(1);
                      setStatusMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-left transition cursor-pointer",
                      !status
                        ? "bg-brand/10 text-brand font-semibold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <span>All statuses</span>
                    {!status && <Check className="h-3.5 w-3.5 text-brand" />}
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <div className="max-h-56 overflow-y-auto space-y-0.5">
                    {PAYMENT_RECORD_STATUSES.map((s) => {
                      const isCurrent = status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setStatus(s);
                            setPage(1);
                            setStatusMenuOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-left capitalize transition cursor-pointer",
                            isCurrent
                              ? "bg-brand/10 text-brand font-semibold"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <span>{s}</span>
                          {isCurrent && <Check className="h-3.5 w-3.5 text-brand" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Method Filter */}
            <div className="relative" ref={methodMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setStatusMenuOpen(false);
                  setMethodMenuOpen((v) => !v);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm outline-none transition cursor-pointer select-none shadow-xs",
                  method
                    ? "border-brand bg-brand-light/40 text-brand font-medium"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                )}
                title="Filter by payment method"
              >
                <span className="capitalize">{method ? method.replace("_", " ") : "All methods"}</span>
                {method ? (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setMethod("");
                      setPage(1);
                    }}
                    className="ml-0.5 rounded p-0.5 hover:bg-brand/10 text-brand transition cursor-pointer"
                    title="Clear method filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </span>
                ) : null}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                    method ? "text-brand" : "text-slate-400",
                    methodMenuOpen && "rotate-180"
                  )}
                />
              </button>

              {methodMenuOpen && (
                <div className="absolute right-0 top-full z-30 mt-1.5 w-48 rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-xl shadow-slate-900/10 animate-modal-in">
                  <button
                    type="button"
                    onClick={() => {
                      setMethod("");
                      setPage(1);
                      setMethodMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-left transition cursor-pointer",
                      !method
                        ? "bg-brand/10 text-brand font-semibold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <span>All methods</span>
                    {!method && <Check className="h-3.5 w-3.5 text-brand" />}
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <div className="max-h-56 overflow-y-auto space-y-0.5">
                    {PAYMENT_METHODS.map((m) => {
                      const isCurrent = method === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setMethod(m);
                            setPage(1);
                            setMethodMenuOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-left capitalize transition cursor-pointer",
                            isCurrent
                              ? "bg-brand/10 text-brand font-semibold"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <span>{m.replace("_", " ")}</span>
                          {isCurrent && <Check className="h-3.5 w-3.5 text-brand" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <DataTable columns={columns} data={payments} loading={loading} emptyTitle="No payments found" emptyDescription="Payment records will appear here once orders are placed." />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </Card>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `Payment — ${detail.orderNumber}` : ""}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetail(null)}>
              Close
            </Button>
            <Button onClick={handleUpdate} loading={updating}>
              Save changes
            </Button>
          </>
        }
      >
        {detail && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Amount</p>
                <p className="font-semibold text-slate-800">{formatCurrency(detail.amount)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Gateway</p>
                <p className="font-semibold capitalize text-slate-800">{detail.gateway}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Customer</p>
                <p className="font-semibold text-slate-800">{detail.customer?.name || "-"}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Paid at</p>
                <p className="font-semibold text-slate-800">{detail.paidAt ? formatDateTime(detail.paidAt) : "Not paid yet"}</p>
              </div>
            </div>
            <Select label="Payment status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {PAYMENT_RECORD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Transaction ID</label>
              <input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. txn_1234567890"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
