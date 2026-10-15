export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(" ");
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatCurrency(amount: number, currency = "LKR"): string {
  try {
    const isNegative = (amount || 0) < 0;
    const absVal = Math.round(Math.abs(amount || 0));
    const formatted = absVal.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return isNegative ? `-LKR ${formatted}` : `LKR ${formatted}`;
  } catch {
    const isNegative = (amount || 0) < 0;
    const absVal = Math.round(Math.abs(amount || 0));
    return isNegative ? `-LKR ${absVal}` : `LKR ${absVal}`;
  }
}

export function formatDate(date: Date | string | undefined | null): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(date: Date | string | undefined | null): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatOrderId(orderNumber?: string, createdAt?: Date | string | null): string {
  if (orderNumber && /^ORD-\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/.test(orderNumber)) {
    return orderNumber;
  }
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear().toString().slice(-2);
      const m = (d.getMonth() + 1).toString().padStart(2, "0");
      const day = d.getDate().toString().padStart(2, "0");
      return `ORD-${y}${m}${day}`;
    }
  }
  if (orderNumber) {
    const match = orderNumber.match(/^ORD-(\d{6})/);
    if (match) return `ORD-${match[1]}`;
  }
  return orderNumber || "-";
}

export async function generateOrderNumber(date = new Date()): Promise<string> {
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `ORD-${y}${m}${d}`;
}

export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildPaginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}

export function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

