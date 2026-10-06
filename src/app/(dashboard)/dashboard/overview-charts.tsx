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
  confirmed: "#6366f1",
  processing: "#0ea5e9",
  shipped: "#8b5cf6",
  delivered: "#10b981",
  cancelled: "#f43f5e",
};

export function SalesTrendChart({ data }: { data: { _id: string; sales: number; orders: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="flex h-72 items-center justify-center text-sm text-slate-400">Not enough data yet</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={288}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="_id" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
          formatter={(value, name) => {
            const num = typeof value === "number" ? value : Number(value || 0);
            return [name === "sales" ? `$${num.toFixed(2)}` : num, name === "sales" ? "Sales" : "Orders"];
          }}
        />
        <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} fill="url(#colorSales)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OrderStatusPieChart({ data }: { data: { status: string; count: number }[] }) {
  const filtered = data.filter((d) => d.count > 0);
  if (filtered.length === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-400">No orders yet</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={filtered} dataKey="count" nameKey="status" innerRadius={55} outerRadius={85} paddingAngle={3}>
          {filtered.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#94a3b8"} />
          ))}
        </Pie>
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, textTransform: "capitalize" }} />
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
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
