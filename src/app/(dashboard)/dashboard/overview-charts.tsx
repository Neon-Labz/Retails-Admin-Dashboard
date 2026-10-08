"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#4f46e5",
  processing: "#4f46e5",
  shipped: "#8b5cf6",
  delivered: "#10b981",
  cancelled: "#f43f5e",
};

export function SalesTrendChart({ data }: { data: { _id: string; sales: number; orders: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="flex h-72 items-center justify-center text-sm text-slate-400">Not enough data yet</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="_id" tick={{ fontSize: 12, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: 12 }}
          formatter={(value, name) => {
            const num = typeof value === "number" ? value : Number(value || 0);
            return [name === "sales" ? `$${num.toFixed(2)}` : num, name === "sales" ? "Sales" : "Orders"];
          }}
        />
        <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3, fill: "#4f46e5" }} fill="url(#colorSales)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OrderStatusPieChart({ data }: { data: { status: string; count: number }[] }) {
  const filtered = data.filter((d) => d.count > 0);
  if (filtered.length === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-400">No orders yet</div>;
  }
  const total = filtered.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-[220px] w-full items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              dataKey="count"
              nameKey="status"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={4}
              stroke="none"
            >
              {filtered.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold tracking-tight text-slate-900">{total}</span>
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Orders</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
        {filtered.map((entry) => (
          <div key={entry.status} className="flex items-center gap-1.5 font-medium text-slate-600 capitalize">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[entry.status] || "#94a3b8" }}
            />
            <span>{entry.status}: <strong className="text-slate-800">{entry.count}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategoryBarChart({ data }: { data: { name: string; productCount: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-400">No categories yet</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
        <Bar dataKey="productCount" fill="#6366f1" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
