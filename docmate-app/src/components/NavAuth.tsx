"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export function NavAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-8 w-20 animate-pulse rounded-lg bg-border" />
    );
  }

  if (user) {
    return (
      <Link
        href="/profile"
        className="flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-light transition-colors"
      >
        <span>{user.role === "doctor" ? "👨‍⚕️" : "👤"}</span>
        <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="text-sm font-medium text-muted hover:text-primary transition-colors"
      >
        Вход
      </Link>
      <Link
        href="/register"
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
      >
        Регистрация
      </Link>
    </div>
  );
}
