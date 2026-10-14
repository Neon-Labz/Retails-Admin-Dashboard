"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/primitives";

export function LoginForm() {
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Login failed");
        return;
      }
      const redirectUrl = searchParams.get("redirect") || "/dashboard";
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-600">{error}</div>}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-800">Email Address</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 pl-9 text-sm text-slate-900 shadow-xs transition placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-800">Password</label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-[#1e293b] hover:text-brand hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 pl-9 pr-10 text-sm text-slate-900 shadow-xs transition placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" loading={loading} className="mt-2 w-full rounded-xl py-2.5 font-semibold" size="lg">
        Sign in
      </Button>

      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 text-[11px] text-slate-500">
        <span>Quick fill:</span>
        <button
          type="button"
          onClick={() => setEmail("admin@gmail.com")}
          className={`rounded-md px-2 py-0.5 font-medium transition cursor-pointer ${
            email === "admin@gmail.com" ? "bg-brand/10 text-brand font-semibold" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          admin@gmail.com
        </button>
        <button
          type="button"
          onClick={() => setEmail("thigamparanneonlabz@gmail.com")}
          className={`rounded-md px-2 py-0.5 font-medium transition cursor-pointer ${
            email === "thigamparanneonlabz@gmail.com" ? "bg-brand/10 text-brand font-semibold" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          thigamparanneonlabz@gmail.com
        </button>
      </div>
    </form>
  );
}
