"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create account");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push(`/verify-email?pending=true&email=${encodeURIComponent(form.email)}`), 1500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl">📧</div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Check your inbox</h1>
        <p className="mt-2 text-sm text-slate-500">
          We sent a verification link to <strong>{form.email}</strong>. Redirecting you...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-extrabold text-slate-900">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">Join BulkMart and start saving on bulk-priced products.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-700"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email address</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-700"
            placeholder="you@email.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Phone (optional)</label>
          <input
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-700"
            placeholder="+1 555 123 4567"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-700"
            placeholder="At least 8 characters"
          />
        </div>

        {error && <div className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-full bg-blue-900 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-blue-900 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
