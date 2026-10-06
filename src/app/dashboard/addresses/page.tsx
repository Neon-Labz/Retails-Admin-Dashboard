"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

const EMPTY_FORM = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
  isDefault: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadAddresses() {
    setLoading(true);
    try {
      const res = await fetch("/api/account/addresses", { cache: "no-store" });
      const data = await res.json();
      setAddresses(data.addresses || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAddresses();
  }, []);

  function updateForm(key: keyof typeof EMPTY_FORM, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save address");
        return;
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadAddresses();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    await loadAddresses();
  }

  async function handleSetDefault(id: string) {
    await fetch(`/api/account/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    await loadAddresses();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Addresses</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your saved billing and shipping addresses.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-blue-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
        >
          {showForm ? "Cancel" : "+ Add address"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-100 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput label="Label" value={form.label} onChange={(v) => updateForm("label", v)} />
            <TextInput label="Full name" value={form.fullName} onChange={(v) => updateForm("fullName", v)} required />
            <TextInput label="Phone" value={form.phone} onChange={(v) => updateForm("phone", v)} required />
            <TextInput label="Country" value={form.country} onChange={(v) => updateForm("country", v)} required />
            <TextInput label="Address line 1" value={form.line1} onChange={(v) => updateForm("line1", v)} required className="sm:col-span-2" />
            <TextInput label="Address line 2" value={form.line2} onChange={(v) => updateForm("line2", v)} className="sm:col-span-2" />
            <TextInput label="City" value={form.city} onChange={(v) => updateForm("city", v)} required />
            <TextInput label="State" value={form.state} onChange={(v) => updateForm("state", v)} required />
            <TextInput label="Postal code" value={form.postalCode} onChange={(v) => updateForm("postalCode", v)} required />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => updateForm("isDefault", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-700"
            />
            Set as default address
          </label>

          {error && <div className="mt-4 rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{error}</div>}

          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-full bg-blue-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save address"}
          </button>
        </form>
      )}

      <div className="mt-8">
        {loading ? (
          <p className="text-slate-400">Loading addresses...</p>
        ) : addresses.length === 0 ? (
          <EmptyState icon="📍" title="No saved addresses" description="Add an address to speed up checkout next time." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {addresses.map((addr) => (
              <div key={addr.id} className="rounded-2xl border border-slate-100 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{addr.label}</span>
                  {addr.isDefault && <span className="text-xs font-semibold text-emerald-600">Default</span>}
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{addr.fullName}</p>
                <p className="text-sm text-slate-500">{addr.line1} {addr.line2}</p>
                <p className="text-sm text-slate-500">{addr.city}, {addr.state} {addr.postalCode}</p>
                <p className="text-sm text-slate-500">{addr.country}</p>
                <p className="mt-1 text-sm text-slate-500">{addr.phone}</p>
                <div className="mt-4 flex gap-3 text-xs font-semibold">
                  {!addr.isDefault && (
                    <button onClick={() => handleSetDefault(addr.id)} className="text-blue-900 hover:underline">
                      Set as default
                    </button>
                  )}
                  <button onClick={() => handleDelete(addr.id)} className="text-rose-600 hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  required,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-700"
      />
    </div>
  );
}
