"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Star,
  ChevronDown,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button, Badge, Card } from "@/components/ui/primitives";
import { DataTable, type Column, Pagination, SearchInput } from "@/components/ui/table";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { ImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface SubcategoryItem {
  _id?: string;
  name: string;
  slug?: string;
}

interface Category {
  _id: string;
  name: string;
  subcategories?: SubcategoryItem[];
}

interface Specification {
  key: string;
  value: string;
}

interface ProductRow {
  _id: string;
  name: string;
  sku: string;
  category: { _id: string; name: string } | null;
  subcategory?: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  lowStockThreshold: number;
  status: "active" | "draft" | "archived";
  isFeatured: boolean;
  images: string[];
  description?: string;
  specifications: Specification[];
  createdAt: string;
}

const emptyForm = {
  name: "",
  description: "",
  category: "",
  subcategory: "",
  price: "",
  salePrice: "",
  sku: "",
  image: "",
  specifications: [{ key: "", value: "" }] as Specification[],
  stock: "0",
  lowStockThreshold: "5",
  status: "active" as "active" | "draft" | "archived",
  isFeatured: false,
};

export default function ProductsPage() {
  const toast = useToast();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/categories?all=true");
    const json = await res.json();
    if (json.success) setCategories(json.data.categories);
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      if (subcategoryFilter) params.set("subcategory", subcategoryFilter);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "10");
      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data.products);
        setMeta(json.data.meta);
      }
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, subcategoryFilter, statusFilter, page]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filterSubcategories = useMemo(() => {
    if (categoryFilter) {
      const matched = categories.find((c) => c._id === categoryFilter);
      return (matched?.subcategories || []).map((s) => s.name);
    }
    const allSubs = new Set<string>();
    categories.forEach((c) => {
      (c.subcategories || []).forEach((s) => {
        if (s.name) allSubs.add(s.name);
      });
    });
    return Array.from(allSubs);
  }, [categoryFilter, categories]);

  const formSubcategories = useMemo(() => {
    if (!form.category) return [];
    const matched = categories.find((c) => c._id === form.category);
    return matched?.subcategories || [];
  }, [form.category, categories]);

  const [fetchingSku, setFetchingSku] = useState(false);

  const fetchNextSku = useCallback(async () => {
    setFetchingSku(true);
    try {
      const res = await fetch("/api/products/next-sku");
      const json = await res.json();
      if (json.success && json.data?.sku) {
        setForm((f) => ({ ...f, sku: json.data.sku }));
      }
    } catch {
      // ignore
    } finally {
      setFetchingSku(false);
    }
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
    fetchNextSku();
  }

  function openEdit(product: ProductRow) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || "",
      category: product.category?._id || "",
      subcategory: product.subcategory || "",
      price: String(product.price),
      salePrice: product.salePrice ? String(product.salePrice) : "",
      sku: product.sku,
      image: product.images?.[0] || "",
      specifications:
        product.specifications && product.specifications.length > 0
          ? product.specifications
          : [{ key: "", value: "" }],
      stock: String(product.stock),
      lowStockThreshold: String(product.lowStockThreshold),
      status: product.status,
      isFeatured: product.isFeatured,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!form.sku.trim()) {
      toast.error("SKU / Product code is required");
      return;
    }
    if (!form.image) {
      toast.error("Product image is required");
      return;
    }
    if (!form.category) {
      toast.error("Category is required");
      return;
    }
    if (!form.subcategory.trim()) {
      toast.error("Subcategory is required");
      return;
    }
    if (!form.status) {
      toast.error("Status is required");
      return;
    }
    if (form.price === "" || isNaN(Number(form.price)) || Number(form.price) < 0) {
      toast.error("Valid price is required");
      return;
    }
    if (form.stock === "" || isNaN(Number(form.stock)) || Number(form.stock) < 0) {
      toast.error("Stock quantity is required");
      return;
    }
    if (form.lowStockThreshold === "" || isNaN(Number(form.lowStockThreshold)) || Number(form.lowStockThreshold) < 0) {
      toast.error("Low alert threshold is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description,
        category: form.category,
        subcategory: form.subcategory.trim(),
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        sku: form.sku.trim(),
        images: form.image ? [form.image] : [],
        specifications: form.specifications.filter((s) => s.key.trim() && s.value.trim()),
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
        status: form.status,
        isFeatured: form.isFeatured,
      };
      const res = await fetch(editing ? `/api/products/${editing._id}` : "/api/products", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Failed to save product");
        return;
      }
      toast.success(editing ? "Product updated successfully" : "Product created successfully");
      setModalOpen(false);
      loadProducts();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleteTarget._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Failed to delete product");
        return;
      }
      toast.success("Product deleted successfully");
      setDeleteTarget(null);
      loadProducts();
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<ProductRow>[] = useMemo(
    () => [
      {
        header: "Product",
        key: "name",
        render: (p) => (
          <div className="flex items-center gap-3">
            {p.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                <Package className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate font-medium text-slate-800">
                {p.name}
                {p.isFeatured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
              </p>
              <p className="text-xs text-slate-400">{p.sku}</p>
            </div>
          </div>
        ),
      },
      { header: "Category", key: "category", render: (p) => p.category?.name || "-" },
      { header: "Subcategory", key: "subcategory", render: (p) => p.subcategory || "-" },
      {
        header: "Price",
        key: "price",
        render: (p) => (
          <div>
            {p.salePrice ? (
              <>
                <span className="font-medium text-slate-800">{formatCurrency(p.salePrice)}</span>{" "}
                <span className="text-xs text-slate-400 line-through">{formatCurrency(p.price)}</span>
              </>
            ) : (
              <span className="font-medium text-slate-800">{formatCurrency(p.price)}</span>
            )}
          </div>
        ),
      },
      {
        header: "Stock",
        key: "stock",
        render: (p) => (
          <Badge color={p.stock <= 0 ? "red" : p.stock <= p.lowStockThreshold ? "yellow" : "green"}>
            {p.stock <= 0 ? "Out of stock" : p.stock <= p.lowStockThreshold ? `Low (${p.stock})` : `${p.stock} units`}
          </Badge>
        ),
      },
      {
        header: "Status",
        key: "status",
        render: (p) => <Badge color={p.status === "active" ? "green" : p.status === "draft" ? "yellow" : "slate"}>{p.status}</Badge>,
      },
      { header: "Created", key: "createdAt", render: (p) => formatDate(p.createdAt) },
      {
        header: "Actions",
        key: "actions",
        render: (p) => (
          <div className="flex items-center gap-1">
            <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => setDeleteTarget(p)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  function updateSpec(idx: number, field: "key" | "value", value: string) {
    setForm((f) => {
      const specs = [...f.specifications];
      specs[idx] = { ...specs[idx], [field]: value };
      return { ...f, specifications: specs };
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your product catalog, pricing and inventory.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            className="flex-1 w-full"
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by name or SKU..."
          />
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setSubcategoryFilter("");
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={subcategoryFilter}
              onChange={(e) => {
                setSubcategoryFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="">All subcategories</option>
              {filterSubcategories.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <DataTable columns={columns} data={products} loading={loading} emptyTitle="No products found" emptyDescription="Create your first product to get started." />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Product" : "Add Product"}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editing ? (
                "Save changes"
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Create product
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-1">
          {/* Row 1: Product name & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-800">
                  Product name <span className="text-indigo-600 font-bold">*</span>
                </label>
                <span className="text-xs text-slate-400 font-medium">Required</span>
              </div>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Adjustable Dumbbell Se"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-xs"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-800">
                  SKU / Product code <span className="text-indigo-600 font-bold">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-indigo-600 font-medium">Auto-generated</span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="e.g. rkf-001"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm font-mono text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-xs"
                />
                <button
                  type="button"
                  onClick={fetchNextSku}
                  title="Generate next sequence SKU"
                  disabled={fetchingSku}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition disabled:opacity-50"
                >
                  <RefreshCw className={cn("h-4 w-4", fetchingSku && "animate-spin text-indigo-600")} />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Description */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800">Description</label>
              <span className="text-xs text-slate-400 font-medium">Optional</span>
            </div>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe features, specs, and details..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-xs resize-none"
            />
          </div>

          {/* Row 3: Product Image */}
          <ImageUpload
            label="Product Image"
            required
            badge="Required"
            value={form.image}
            onChange={(url) => setForm((f) => ({ ...f, image: url }))}
            folder="products"
          />

          {/* Row 4: Category, Subcategory, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                Category <span className="text-indigo-600 font-bold">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subcategory: "" }))}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-8 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-xs"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                Subcategory <span className="text-indigo-600 font-bold">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={form.subcategory}
                  onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-8 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-xs"
                >
                  <option value="">Select subcategory</option>
                  {formSubcategories.map((s, idx) => (
                    <option key={s._id || idx} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                Status <span className="text-indigo-600 font-bold">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as typeof form.status }))}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-8 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-xs capitalize"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Row 5: Price, Sale price, Stock qty, Low alert */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                Price <span className="text-indigo-600 font-bold">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="$0.00"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-xs"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Sale price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.salePrice}
                onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value }))}
                placeholder="$0.00"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-xs"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                Stock qty <span className="text-indigo-600 font-bold">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-xs"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                Low alert <span className="text-indigo-600 font-bold">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={form.lowStockThreshold}
                onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))}
                placeholder="5"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-xs"
              />
            </div>
          </div>

          {/* Row 6: Specifications */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800">Specifications</label>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, specifications: [...f.specifications, { key: "", value: "" }] }))}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition flex items-center gap-1"
              >
                + Add spec
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {form.specifications.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <input
                    placeholder="Attribute (e.g. Color)"
                    value={spec.key}
                    onChange={(e) => updateSpec(idx, "key", e.target.value)}
                    className="w-1/2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-xs"
                  />
                  <input
                    placeholder="Value (e.g. Red)"
                    value={spec.value}
                    onChange={(e) => updateSpec(idx, "value", e.target.value)}
                    className="w-1/2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, specifications: f.specifications.filter((_, i) => i !== idx) }))}
                    className="rounded-lg p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
                    title="Remove specification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Row 7: Mark as featured product */}
          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <span className="text-sm font-semibold text-slate-800">Mark as featured product</span>
                <span className="ml-2 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                  Featured
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                Highlight this product on the storefront homepage
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.isFeatured}
              onClick={() => setForm((f) => ({ ...f, isFeatured: !f.isFeatured }))}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                form.isFeatured ? "bg-indigo-600" : "bg-slate-200"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  form.isFeatured ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete product?"
        description={`This will permanently delete "${deleteTarget?.name}". This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
