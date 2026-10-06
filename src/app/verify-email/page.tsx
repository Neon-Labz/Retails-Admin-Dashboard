"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const pending = searchParams.get("pending") === "true";
  const initialEmail = searchParams.get("email") || "";

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    token ? "loading" : "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState(initialEmail);
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent">("idle");

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "Verification failed");
          return;
        }
        setStatus("success");
        setMessage(data.message);
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    })();
  }, [token]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setResendStatus("loading");
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendStatus("sent");
    } catch {
      setResendStatus("idle");
    }
  }

  if (token) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
        {status === "loading" && <p className="text-slate-500">Verifying your email...</p>}
        {status === "success" && (
          <>
            <div className="text-5xl">✅</div>
            <h1 className="mt-4 text-xl font-bold text-slate-900">Email verified!</h1>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
            <Link href="/login" className="mt-6 rounded-full bg-blue-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-800">
              Log in now
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-5xl">⚠️</div>
            <h1 className="mt-4 text-xl font-bold text-slate-900">Verification failed</h1>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
            <Link href="/verify-email?pending=true" className="mt-6 text-sm font-semibold text-blue-900 hover:underline">
              Request a new link
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 text-center sm:px-6">
      <div className="text-5xl">📧</div>
      <h1 className="mt-4 text-xl font-bold text-slate-900">
        {pending ? "Verify your email to continue" : "Check your email"}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        We sent a verification link to your inbox. Click it to activate your account before logging in
        or placing an order.
      </p>

      <form onSubmit={handleResend} className="mt-6 flex flex-col gap-3 text-left">
        <label className="text-sm font-medium text-slate-700">Didn&apos;t get the email? Resend it:</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-700"
        />
        <button
          type="submit"
          disabled={resendStatus === "loading"}
          className="w-full rounded-full bg-blue-900 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
        >
          {resendStatus === "sent" ? "Email sent ✓" : resendStatus === "loading" ? "Sending..." : "Resend verification email"}
        </button>
      </form>

      <Link href="/login" className="mt-6 text-sm font-semibold text-blue-900 hover:underline">
        Back to log in
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
