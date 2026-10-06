import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar user={user} />
        <div className="flex-1">
          {!user.emailVerified && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Your email isn&apos;t verified yet. Please check your inbox to verify your account before placing
              orders.{" "}
              <a href="/verify-email?pending=true" className="font-semibold underline">
                Resend verification email
              </a>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
