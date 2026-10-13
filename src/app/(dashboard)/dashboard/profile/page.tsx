"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, UserCircle } from "lucide-react";
import { Button, Card, Input, LoadingState, Badge } from "@/components/ui/primitives";
import { ImageUploader } from "@/components/ui/image-uploader";
import { useToast } from "@/components/ui/toast";
import { ROLE_LABELS, type AdminRole } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

function validateName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "Full name is required";
  if (trimmed.length < 2) return "Full name must be at least 2 characters";
  if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) return "Full name can only contain letters and spaces";
  return "";
}

function validateEmail(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "Email address is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
    return "Please enter a valid email address (e.g., admin@example.com)";
  }
  return "";
}

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileErrors, setProfileErrors] = useState<{ name?: string; email?: string }>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (json.success) setProfile(json.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSaveProfile() {
    if (!profile) return;
    const nameError = validateName(profile.name);
    const emailError = validateEmail(profile.email);
    setProfileErrors({ name: nameError, email: emailError });
    if (nameError || emailError) return;

    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name.trim(),
          email: profile.email.trim(),
          avatar: profile.avatar,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.errors) {
          setProfileErrors({
            name: json.errors.name?.[0],
            email: json.errors.email?.[0],
          });
        } else if (res.status === 409) {
          setProfileErrors((prev) => ({ ...prev, email: "This email address is already in use" }));
        } else {
          toast.error(json.message || "Failed to update profile");
        }
        return;
      }
      setProfileErrors({});
      toast.success("Profile updated successfully");
      window.dispatchEvent(new Event("admin-profile-updated"));
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) return <LoadingState label="Loading profile..." />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Admin Profile</h1>
        <p className="mt-0.5 text-xs sm:text-sm text-slate-500">Manage your personal account information.</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center gap-4 border-b border-slate-100 pb-6 sm:flex-row">
          <ImageUploader images={profile.avatar ? [profile.avatar] : []} onChange={(images) => setProfile({ ...profile, avatar: images[0] || "" })} folder="avatars" max={1} />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-lg font-semibold text-slate-900">{profile.name}</p>
            <p className="text-sm text-slate-500">{profile.email}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge color="purple">{ROLE_LABELS[profile.role]}</Badge>
              {profile.lastLoginAt && <span className="text-xs text-slate-400">Last login: {formatDateTime(profile.lastLoginAt)}</span>}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <UserCircle className="h-4 w-4" /> Personal Information
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              value={profile.name}
              onChange={(e) => {
                const val = e.target.value;
                setProfile({ ...profile, name: val });
                setProfileErrors((prev) => ({ ...prev, name: validateName(val) }));
              }}
              error={profileErrors.name}
            />
            <Input
              label="Email address"
              type="email"
              value={profile.email}
              onChange={(e) => {
                const val = e.target.value;
                setProfile({ ...profile, email: val });
                setProfileErrors((prev) => ({ ...prev, email: validateEmail(val) }));
              }}
              error={profileErrors.email}
            />
          </div>
          <div>
            <Button onClick={handleSaveProfile} loading={saving}>
              <Save className="h-4 w-4" /> Save changes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
