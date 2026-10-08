"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Package, Star } from "lucide-react";
import { Button, Badge, Card, Select, Input, Textarea, Switch } from "@/components/ui/primitives";
import { DataTable, type Column, Pagination, SearchInput } from "@/components/ui/table";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { ImageUploader } from "@/components/ui/image-uploader";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
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
  price: "",
  salePrice: "",
  sku: "",
  images: [] as string[],
  specifications: [] as Specification[],
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
  }, [search, categoryFilter, statusFilter, page]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(product: ProductRow) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || "",
      category: product.category?._id || "",
      price: String(product.price),
      salePrice: product.salePrice ? String(product.salePrice) : "",
      sku: product.sku,
      images: product.images || [],
      specifications: product.specifications || [],
      stock: String(product.stock),
      lowStockThreshold: String(product.lowStockThreshold),
      status: product.status,
      isFeatured: product.isFeatured,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        sku: form.sku,
        images: form.images,
        specifications: form.specifications.filter((s) => s.key && s.value),
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
            <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#093B84]">
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or SKU..." />
          <div className="flex flex-wrap gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#093B84]"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#093B84]"
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
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? "Save changes" : "Create product"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Product Images</label>
            <ImageUploader images={form.images} onChange={(images) => setForm((f) => ({ ...f, images }))} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Product name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <Input label="SKU / Product code" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} required />
          </div>
          <Textarea
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} required>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as typeof form.status }))}>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Input label="Price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
            <Input label="Sale price" type="number" min="0" step="0.01" value={form.salePrice} onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value }))} />
            <Input label="Stock qty" type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
            <Input label="Low stock alert" type="number" min="0" value={form.lowStockThreshold} onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Specifications</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setForm((f) => ({ ...f, specifications: [...f.specifications, { key: "", value: "" }] }))}
              >
                <Plus className="h-3.5 w-3.5" /> Add spec
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {form.specifications.map((spec, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    placeholder="Attribute (e.g. Color)"
                    value={spec.key}
                    onChange={(e) => updateSpec(idx, "key", e.target.value)}
                    className="w-1/2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-[#093B84]"
                  />
                  <input
                    placeholder="Value (e.g. Red)"
                    value={spec.value}
                    onChange={(e) => updateSpec(idx, "value", e.target.value)}
                    className="w-1/2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-[#093B84]"
                  />
                  <button
                    onClick={() => setForm((f) => ({ ...f, specifications: f.specifications.filter((_, i) => i !== idx) }))}
                    className="rounded-lg px-2 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Switch checked={form.isFeatured} onChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} label="Mark as featured product" />
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
