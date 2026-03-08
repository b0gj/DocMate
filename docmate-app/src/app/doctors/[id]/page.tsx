import Link from "next/link";
import { notFound } from "next/navigation";

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

  // Group slots by date
  const slotsByDate = new Map<string, typeof slots>();
  for (const slot of slots) {
    const date = new Date(slot.dateTime).toLocaleDateString("bg-BG", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!slotsByDate.has(date)) slotsByDate.set(date, []);
    slotsByDate.get(date)!.push(slot);
  }

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

      <div className="mt-8">
        <h2 className="text-xl font-bold text-foreground">
          Свободни часове
        </h2>

        {slots.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Няма свободни часове в момента.
          </p>
        ) : (
          <div className="mt-4 space-y-6">
            {Array.from(slotsByDate.entries()).map(([date, dateSlots]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-foreground capitalize">
                  {date}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {dateSlots.map(
                    (slot: { _id: string; dateTime: string }) => (
                      <span
                        key={slot._id}
                        className="rounded-lg border border-primary/30 bg-accent px-3 py-1.5 text-sm font-medium text-primary cursor-default hover:bg-primary hover:text-white transition-colors"
                      >
                        {new Date(slot.dateTime).toLocaleTimeString("bg-BG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
