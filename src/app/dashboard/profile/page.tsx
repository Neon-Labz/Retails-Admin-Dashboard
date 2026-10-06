"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
    }
  }, [user]);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileStatus(null);
    setSavingProfile(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error || "Failed to update profile");
        return;
      }
      await refresh();
      setProfileStatus("Profile updated successfully.");
    } catch {
      setProfileError("Something went wrong. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordStatus(null);
    setSavingPassword(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Failed to update password");
        return;
      }
      setPasswordStatus("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setPasswordError("Something went wrong. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading || !user) {
    return <p className="text-slate-400">Loading profile...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900">Profile</h1>
      <p className="mt-1 text-sm text-slate-500">Manage your personal information and account security.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form onSubmit={handleProfileSubmit} className="rounded-2xl border border-slate-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Personal information</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email address</label>
              <input
                value={user.email}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-700"
              />
            </div>
            <p className="text-xs text-slate-400">Member since {formatDate(user.createdAt)}</p>

            {profileError && <div className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{profileError}</div>}
            {profileStatus && <div className="rounded-lg bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">{profileStatus}</div>}

            <button
              type="submit"
              disabled={savingProfile}
              className="w-fit rounded-full bg-blue-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              {savingProfile ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>

        <form onSubmit={handlePasswordSubmit} className="rounded-2xl border border-slate-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Change password</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">New password</label>
              <input
                type="password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-700"
              />
            </div>

            {passwordError && <div className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{passwordError}</div>}
            {passwordStatus && <div className="rounded-lg bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">{passwordStatus}</div>}

            <button
              type="submit"
              disabled={savingPassword}
              className="w-fit rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {savingPassword ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
