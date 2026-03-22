"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

const SPECIALTIES = [
  "Кардиология",
  "Неврология",
  "Дерматология",
  "Ортопедия",
  "Офталмология",
  "Гастроентерология",
  "Педиатрия",
  "Урология",
  "Ендокринология",
  "Пулмология",
];

const CITIES = ["София", "Пловдив", "Варна", "Бургас"];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    city: "",
    specialty: "",
    hospital: "",
    price: "",
    bio: "",
    workingHours: "09:00 - 17:00",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Паролите не съвпадат.");
      return;
    }

    setLoading(true);

    const result = await register({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      role,
      phone: formData.phone || undefined,
      city: formData.city || undefined,
      specialty: role === "doctor" ? formData.specialty : undefined,
      hospital: role === "doctor" ? formData.hospital : undefined,
      price: role === "doctor" ? Number(formData.price) : undefined,
      bio: role === "doctor" ? formData.bio : undefined,
      workingHours: role === "doctor" ? formData.workingHours : undefined,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push("/profile");
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground text-center">
          Регистрация
        </h1>
        <p className="mt-2 text-sm text-muted text-center">
          Създайте акаунт като пациент или лекар
        </p>

        {/* Role selector */}
        <div className="mt-6 flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setRole("patient")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              role === "patient"
                ? "bg-primary text-white"
                : "bg-background text-muted hover:text-foreground"
            }`}
          >
            Пациент
          </button>
          <button
            type="button"
            onClick={() => setRole("doctor")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              role === "doctor"
                ? "bg-primary text-white"
                : "bg-background text-muted hover:text-foreground"
            }`}
          >
            Лекар
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Common fields */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Име *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={role === "doctor" ? "Д-р Иван Иванов" : "Иван Иванов"}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Имейл *
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="example@email.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Парола *
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Потвърдете *
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                Телефон
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="+359 888 123 456"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-foreground">
                Град
              </label>
              <select
                id="city"
                value={formData.city}
                onChange={(e) => updateField("city", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Изберете град</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Doctor-specific fields */}
          {role === "doctor" && (
            <>
              <hr className="border-border" />
              <p className="text-sm font-medium text-primary">
                Професионална информация
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="specialty" className="block text-sm font-medium text-foreground">
                    Специалност *
                  </label>
                  <select
                    id="specialty"
                    required
                    value={formData.specialty}
                    onChange={(e) => updateField("specialty", e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Изберете</option>
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-foreground">
                    Цена (лв) *
                  </label>
                  <input
                    id="price"
                    type="number"
                    required
                    min={0}
                    value={formData.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="80"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="hospital" className="block text-sm font-medium text-foreground">
                  Болница / Кабинет *
                </label>
                <input
                  id="hospital"
                  type="text"
                  required
                  value={formData.hospital}
                  onChange={(e) => updateField("hospital", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="УМБАЛ Александровска"
                />
              </div>

              <div>
                <label htmlFor="workingHours" className="block text-sm font-medium text-foreground">
                  Работно време
                </label>
                <input
                  id="workingHours"
                  type="text"
                  value={formData.workingHours}
                  onChange={(e) => updateField("workingHours", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="09:00 - 17:00"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-foreground">
                  Кратка биография
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => updateField("bio", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Опишете вашия опит и квалификации..."
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Регистрация..." : "Регистрирай се"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Вече имате акаунт?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Влезте
          </Link>
        </p>
      </div>
    </div>
  );
}
