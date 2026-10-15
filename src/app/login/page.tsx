import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#d9e6f7] via-[#ebf2fb] to-[#f4f7fb] px-4">
      {/* Ambient glowing brand blur directly behind the card */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -top-16 -right-16 h-80 w-80 rounded-full bg-indigo-500/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-brand/15 blur-2xl" />

      <div className="relative w-full max-w-[420px]">
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 sm:p-9 shadow-xl shadow-brand/5 backdrop-blur-xl">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200 p-1">
              <Image src="/images/logo.png" alt="RKF Logo" width={56} height={56} priority className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">RKF Admin</h1>
              <p className="mt-0.5 text-sm text-slate-500">Sign in to manage your e-commerce & retail store</p>
            </div>
          </div>
          <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-slate-100" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
