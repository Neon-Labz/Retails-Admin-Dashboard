"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, Trash2, PackageX, PackageMinus, ShoppingBag, UserPlus, CreditCard, RefreshCcw, Info } from "lucide-react";
import { Button, Card, EmptyState, LoadingState } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatDateTime, cn } from "@/lib/utils";
import type { NotificationType } from "@/lib/constants";

interface NotificationRow {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

const ICONS: Record<NotificationType, React.ElementType> = {
  new_order: ShoppingBag,
  new_customer: UserPlus,
  low_stock: PackageMinus,
  out_of_stock: PackageX,
  payment_update: CreditCard,
  order_status: RefreshCcw,
  system: Info,
};

export default function NotificationsPage() {
  const toast = useToast();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "unread") params.set("unreadOnly", "true");
      params.set("page", String(page));
      params.set("limit", "10");
      const res = await fetch(`/api/notifications?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data.notifications);
        setMeta(json.data.meta);
      }
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleRead(n: NotificationRow) {
    const res = await fetch(`/api/notifications/${n._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: !n.isRead }),
    });
    const json = await res.json();
    if (json.success) load();
  }

  async function remove(n: NotificationRow) {
    const res = await fetch(`/api/notifications/${n._id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      toast.success("Notification deleted");
      load();
    }
  }

  async function markAllRead() {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark-all-read" }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("All notifications marked as read");
      load();
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">Stay on top of orders, stock alerts and customer activity.</p>
        </div>
        <Button variant="outline" onClick={markAllRead}>
          <CheckCheck className="h-4 w-4" /> Mark all as read
        </Button>
      </div>

      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-sm font-medium transition capitalize",
              filter === f ? "bg-[#093B84] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <LoadingState />
        ) : notifications.length === 0 ? (
          <EmptyState icon={<Bell className="h-10 w-10" />} title="No notifications" description="You're all caught up!" />
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => {
              const Icon = ICONS[n.type] || Info;
              return (
                <div key={n._id} className={cn("flex items-start gap-3 px-5 py-4", !n.isRead && "bg-[#093B84]/5")}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#093B84]/10 text-[#093B84]">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                    <p className="text-sm text-slate-500">{n.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => toggleRead(n)}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#093B84] hover:bg-[#093B84]/10"
                    >
                      {n.isRead ? "Mark unread" : "Mark read"}
                    </button>
                    <button onClick={() => remove(n)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </Card>
    </div>
  );
}
