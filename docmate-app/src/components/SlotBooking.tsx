"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface Slot {
  _id: string;
  dateTime: string;
  durationMinutes: number;
}

interface SlotBookingProps {
  slots: Slot[];
  doctorName: string;
}

export function SlotBooking({ slots, doctorName }: SlotBookingProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Group slots by date
  const slotsByDate = new Map<string, Slot[]>();
  for (const slot of slots) {
    const date = new Date(slot.dateTime).toLocaleDateString("bg-BG", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!slotsByDate.has(date)) slotsByDate.set(date, []);
    slotsByDate.get(date)!.push(slot);
  }

  async function handleBook() {
    if (!selectedSlot) return;

    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: selectedSlot._id, notes }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/bookings"), 1500);
    } catch {
      setError("Грешка при запазване на час.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-lg font-semibold text-green-700">
          Часът е запазен успешно!
        </p>
        <p className="mt-1 text-sm text-green-600">
          Пренасочване към вашите резервации...
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-foreground">Свободни часове</h2>

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
                {dateSlots.map((slot) => {
                  const isSelected = selectedSlot?._id === slot._id;
                  return (
                    <button
                      key={slot._id}
                      onClick={() =>
                        setSelectedSlot(isSelected ? null : slot)
                      }
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : "border-primary/30 bg-accent text-primary hover:bg-primary hover:text-white"
                      }`}
                    >
                      {new Date(slot.dateTime).toLocaleTimeString("bg-BG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking confirmation */}
      {selectedSlot && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">
            Потвърждение на час
          </h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Лекар</span>
              <span className="text-foreground font-medium">{doctorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Дата</span>
              <span className="text-foreground">
                {new Date(selectedSlot.dateTime).toLocaleDateString("bg-BG", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Час</span>
              <span className="text-foreground font-medium">
                {new Date(selectedSlot.dateTime).toLocaleTimeString("bg-BG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Продължителност</span>
              <span className="text-foreground">
                {selectedSlot.durationMinutes} мин.
              </span>
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-foreground"
            >
              Бележки (по избор)
            </label>
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Опишете накратко причината за посещението..."
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {error && (
            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleBook}
              disabled={loading}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading
                ? "Запазване..."
                : user
                  ? "Запази час"
                  : "Влезте, за да запазите"}
            </button>
            <button
              onClick={() => setSelectedSlot(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Отказ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
