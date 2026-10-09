import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { Store } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-200 border border-slate-100">
            <Image src="/images/logo.png" alt="RKF Logo" width={64} height={64} priority className="h-full w-full object-contain scale-125" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">RKF Admin</h1>
            <p className="text-sm text-slate-500">Sign in to manage your e-commerce & retail store</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Demo credentials: admin@example.com / Admin@12345
        </p>
      </div>
    </div>
  );
}
