"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

interface BookingSlot {
  _id: string;
  dateTime: string;
  durationMinutes: number;
}

interface BookingDoctor {
  _id: string;
  name: string;
  specialty: string;
  hospital: string;
  city: string;
  price: number;
}

interface Booking {
  _id: string;
  doctorId: BookingDoctor;
  slotId: BookingSlot;
  status: "pending" | "confirmed" | "cancelled";
  notes: string;
  cancelledBy?: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Очаква потвърждение",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  confirmed: {
    label: "Потвърден",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  cancelled: {
    label: "Отменен",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

export default function BookingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) fetchBookings();
  }, [user, authLoading, router, fetchBookings]);

  async function handleCancel(bookingId: string) {
    if (!confirm("Сигурни ли сте, че искате да отмените тази резервация?")) {
      return;
    }

    setCancellingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b._id === bookingId
              ? { ...b, status: "cancelled", cancelledBy: "patient" }
              : b
          )
        );
      }
    } catch {
      // ignore
    } finally {
      setCancellingId(null);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted">Зареждане...</p>
      </div>
    );
  }

  const upcoming = bookings.filter(
    (b) =>
      b.status !== "cancelled" &&
      b.slotId &&
      new Date(b.slotId.dateTime) >= new Date()
  );
  const past = bookings.filter(
    (b) =>
      b.status === "cancelled" ||
      !b.slotId ||
      new Date(b.slotId.dateTime) < new Date()
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">Моите резервации</h1>

      {bookings.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-muted">Нямате резервации все още.</p>
          <Link
            href="/doctors"
            className="mt-4 inline-block rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Разгледайте лекарите
          </Link>
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-foreground">
                Предстоящи ({upcoming.length})
              </h2>
              <div className="mt-3 space-y-4">
                {upcoming.map((booking) => (
                  <BookingCard
                    key={booking._id}
                    booking={booking}
                    onCancel={handleCancel}
                    cancelling={cancellingId === booking._id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past / cancelled */}
          {past.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-muted">
                Минали / Отменени ({past.length})
              </h2>
              <div className="mt-3 space-y-4 opacity-70">
                {past.map((booking) => (
                  <BookingCard
                    key={booking._id}
                    booking={booking}
                    onCancel={handleCancel}
                    cancelling={cancellingId === booking._id}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  onCancel,
  cancelling,
}: {
  booking: Booking;
  onCancel: (id: string) => void;
  cancelling: boolean;
}) {
  const statusInfo = STATUS_LABELS[booking.status];
  const isFuture =
    booking.slotId && new Date(booking.slotId.dateTime) >= new Date();
  const canCancel =
    booking.status !== "cancelled" && isFuture;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/doctors/${booking.doctorId._id}`}
            className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
          >
            {booking.doctorId.name}
          </Link>
          <p className="text-sm text-primary">{booking.doctorId.specialty}</p>
          <p className="text-xs text-muted">
            {booking.doctorId.hospital}, {booking.doctorId.city}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-0.5 text-xs font-medium ${statusInfo.className}`}
        >
          {statusInfo.label}
        </span>
      </div>

      {booking.slotId && (
        <div className="mt-3 flex items-center gap-4 text-sm">
          <span className="text-foreground font-medium">
            {new Date(booking.slotId.dateTime).toLocaleDateString("bg-BG", {
              weekday: "short",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span className="text-primary font-semibold">
            {new Date(booking.slotId.dateTime).toLocaleTimeString("bg-BG", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="text-muted">
            {booking.slotId.durationMinutes} мин.
          </span>
        </div>
      )}

      {booking.notes && (
        <p className="mt-2 text-xs text-muted">
          Бележки: {booking.notes}
        </p>
      )}

      {booking.cancelledBy && (
        <p className="mt-1 text-xs text-red-600">
          Отменен от: {booking.cancelledBy === "patient" ? "пациента" : "лекаря"}
        </p>
      )}

      {canCancel && (
        <button
          onClick={() => onCancel(booking._id)}
          disabled={cancelling}
          className="mt-3 rounded-lg border border-red-200 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {cancelling ? "Отменяне..." : "Отмени резервация"}
        </button>
      )}
    </div>
  );
}
