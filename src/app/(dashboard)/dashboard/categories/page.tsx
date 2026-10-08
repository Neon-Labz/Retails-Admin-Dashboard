"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { Button, Badge, Card, Input, Textarea, Switch } from "@/components/ui/primitives";
import { DataTable, type Column, Pagination, SearchInput } from "@/components/ui/table";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { ImageUploader } from "@/components/ui/image-uploader";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

interface CategoryRow {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

const emptyForm = { name: "", description: "", image: "", isActive: true };

export default function CategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", "10");
      const res = await fetch(`/api/categories?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCategories(json.data.categories);
        setMeta(json.data.meta);
      }
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(category: CategoryRow) {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description || "",
      image: category.image || "",
      isActive: category.isActive,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/categories/${editing._id}` : "/api/categories", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Failed to save category");
        return;
      }
      toast.success(editing ? "Category updated successfully" : "Category created successfully");
      setModalOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deleteTarget._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Failed to delete category");
        return;
      }
      toast.success("Category deleted successfully");
      setDeleteTarget(null);
      load();
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<CategoryRow>[] = useMemo(
    () => [
      {
        header: "Category",
        key: "name",
        render: (c) => (
          <div className="flex items-center gap-3">
            {c.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.image} alt={c.name} className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                <Tags className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="font-medium text-slate-800">{c.name}</p>
              {c.description && <p className="max-w-xs truncate text-xs text-slate-400">{c.description}</p>}
            </div>
          </div>
        ),
      },
      { header: "Products", key: "productCount", render: (c) => <Badge color="blue">{c.productCount}</Badge> },
      { header: "Status", key: "isActive", render: (c) => <Badge color={c.isActive ? "green" : "slate"}>{c.isActive ? "Active" : "Inactive"}</Badge> },
      { header: "Created", key: "createdAt", render: (c) => formatDate(c.createdAt) },
      {
        header: "Actions",
        key: "actions",
        render: (c) => (
          <div className="flex items-center gap-1">
            <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#093B84]">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => setDeleteTarget(c)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">Organize your products into categories.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <Card className="p-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search categories..." />
      </Card>

      <Card>
        <DataTable columns={columns} data={categories} loading={loading} emptyTitle="No categories found" emptyDescription="Create your first category to organize products." />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Category" : "Add Category"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? "Save changes" : "Create category"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Category Image</label>
            <ImageUploader images={form.image ? [form.image] : []} onChange={(images) => setForm((f) => ({ ...f, image: images[0] || "" }))} folder="categories" max={1} />
          </div>
          <Input label="Category name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Switch checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} label="Active" />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete category?"
        description={
          deleteTarget && deleteTarget.productCount > 0
            ? `This category has ${deleteTarget.productCount} product(s) assigned and cannot be deleted until they are reassigned.`
            : `This will permanently delete "${deleteTarget?.name}".`
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
