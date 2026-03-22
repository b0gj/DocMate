import Link from "next/link";
import { notFound } from "next/navigation";
import { SlotBooking } from "@/components/SlotBooking";

interface DoctorProfileProps {
  params: Promise<{ id: string }>;
}

async function fetchDoctor(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/doctors/${id}`, {
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Грешка при зареждане");
  return res.json();
}

export default async function DoctorProfile({ params }: DoctorProfileProps) {
  const { id } = await params;
  const data = await fetchDoctor(id);

  if (!data) notFound();

  const { doctor, slots } = data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/doctors"
        className="text-sm text-muted hover:text-primary transition-colors"
      >
        ← Обратно към каталога
      </Link>

      <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent text-4xl">
            🩺
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {doctor.name}
            </h1>
            <p className="text-lg text-primary font-medium">
              {doctor.specialty}
            </p>
            <p className="mt-1 text-sm text-muted">
              {doctor.hospital}, {doctor.city}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-accent p-3 text-center">
            <p className="text-2xl font-bold text-foreground">
              {doctor.price} лв.
            </p>
            <p className="text-xs text-muted">Цена на преглед</p>
          </div>
          <div className="rounded-lg bg-accent p-3 text-center">
            <p className="text-2xl font-bold text-rating">
              ★ {doctor.rating.toFixed(1)}
            </p>
            <p className="text-xs text-muted">Рейтинг</p>
          </div>
          {doctor.workingHours && (
            <div className="rounded-lg bg-accent p-3 text-center">
              <p className="text-sm font-medium text-foreground">
                {doctor.workingHours}
              </p>
              <p className="text-xs text-muted">Работно време</p>
            </div>
          )}
          {doctor.phone && (
            <div className="rounded-lg bg-accent p-3 text-center">
              <p className="text-sm font-medium text-foreground">
                {doctor.phone}
              </p>
              <p className="text-xs text-muted">Телефон</p>
            </div>
          )}
        </div>

        {doctor.bio && (
          <div className="mt-6">
            <h2 className="text-base font-semibold text-foreground">
              За лекаря
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {doctor.bio}
            </p>
          </div>
        )}
      </div>

      <SlotBooking slots={slots} doctorName={doctor.name} />
    </div>
  );
}
