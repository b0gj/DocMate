"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface DoctorProfile {
  _id: string;
  specialty: string;
  hospital: string;
  price: number;
  rating: number;
  bio: string;
  workingHours: string;
}

interface FullUser {
  _id: string;
  email: string;
  name: string;
  role: "patient" | "doctor";
  phone?: string;
  city?: string;
  doctorProfile?: DoctorProfile;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [profile, setProfile] = useState<FullUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, router]);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setFormData({
          name: data.user.name || "",
          phone: data.user.phone || "",
          city: data.user.city || "",
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => (prev ? { ...prev, ...data.user } : prev));
        setEditing(false);
        setMessage("Профилът е обновен успешно.");
      }
    } catch {
      setMessage("Грешка при запазване.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted">Зареждане...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Моят профил</h1>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground hover:border-foreground transition-colors"
        >
          Изход
        </button>
      </div>

      {message && (
        <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {/* Profile card */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-3xl">
            {profile.role === "doctor" ? "👨‍⚕️" : "👤"}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {profile.name}
            </h2>
            <p className="text-sm text-muted">{profile.email}</p>
            <span className="mt-1 inline-block rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-primary">
              {profile.role === "doctor" ? "Лекар" : "Пациент"}
            </span>
          </div>
        </div>

        <hr className="my-6 border-border" />

        {/* Editable fields */}
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Име
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Град
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {saving ? "Запазване..." : "Запази"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Отказ
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted">Телефон</span>
              <span className="text-sm text-foreground">
                {profile.phone || "Не е посочен"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted">Град</span>
              <span className="text-sm text-foreground">
                {profile.city || "Не е посочен"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted">Регистриран на</span>
              <span className="text-sm text-foreground">
                {new Date(profile.createdAt).toLocaleDateString("bg-BG")}
              </span>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-primary hover:bg-primary-light transition-colors"
            >
              Редактирай профила
            </button>
          </div>
        )}
      </div>

      {/* Doctor-specific info */}
      {profile.role === "doctor" && profile.doctorProfile && (
        <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">
            Професионална информация
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted">Специалност</span>
              <span className="text-sm text-foreground">
                {profile.doctorProfile.specialty}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted">Болница / Кабинет</span>
              <span className="text-sm text-foreground">
                {profile.doctorProfile.hospital}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted">Цена на преглед</span>
              <span className="text-sm text-foreground">
                {profile.doctorProfile.price} лв
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted">Рейтинг</span>
              <span className="text-sm text-foreground">
                ⭐ {profile.doctorProfile.rating.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted">Работно време</span>
              <span className="text-sm text-foreground">
                {profile.doctorProfile.workingHours || "Не е посочено"}
              </span>
            </div>
            {profile.doctorProfile.bio && (
              <div className="pt-2">
                <span className="text-sm text-muted">Биография</span>
                <p className="mt-1 text-sm text-foreground">
                  {profile.doctorProfile.bio}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
