"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface BookingPatient {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface BookingSlot {
  _id: string;
  dateTime: string;
  durationMinutes: number;
}

interface BookingDoctor {
  _id: string;
  name: string;
  specialty: string;
}

interface Booking {
  _id: string;
  patientId: BookingPatient;
  doctorId: BookingDoctor;
  slotId: BookingSlot;
  status: "pending" | "confirmed" | "cancelled";
  notes: string;
  cancelledBy?: string;
  createdAt: string;
}

interface DoctorProfile {
  _id: string;
  name: string;
  specialty: string;
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

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Slot generation form
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slotForm, setSlotForm] = useState({
    startDate: "",
    endDate: "",
    startHour: 9,
    endHour: 17,
    slotDuration: 30,
  });
  const [slotMessage, setSlotMessage] = useState("");
  const [generatingSlots, setGeneratingSlots] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, bookingsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/bookings"),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setDoctorProfile(profileData.user.doctorProfile);
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData.bookings);
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
    if (!authLoading && user?.role !== "doctor") {
      router.push("/profile");
      return;
    }
    if (user) fetchData();
  }, [user, authLoading, router, fetchData]);

  async function handleUpdateStatus(bookingId: string, status: string) {
    setUpdatingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b._id === bookingId
              ? {
                  ...b,
                  status: status as Booking["status"],
                  ...(status === "cancelled" ? { cancelledBy: "doctor" } : {}),
                }
              : b
          )
        );
      }
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleGenerateSlots() {
    if (!doctorProfile) return;
    setGeneratingSlots(true);
    setSlotMessage("");

    try {
      const res = await fetch(`/api/doctors/${doctorProfile._id}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slotForm),
      });
      const data = await res.json();
      if (res.ok) {
        setSlotMessage(data.message);
        setShowSlotForm(false);
      } else {
        setSlotMessage(data.error);
      }
    } catch {
      setSlotMessage("Грешка при генериране на часове.");
    } finally {
      setGeneratingSlots(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted">Зареждане...</p>
      </div>
    );
  }

  const pending = bookings.filter((b) => b.status === "pending");
  const confirmed = bookings.filter(
    (b) =>
      b.status === "confirmed" &&
      b.slotId &&
      new Date(b.slotId.dateTime) >= new Date()
  );
  const pastOrCancelled = bookings.filter(
    (b) =>
      b.status === "cancelled" ||
      (b.status === "confirmed" &&
        b.slotId &&
        new Date(b.slotId.dateTime) < new Date())
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Табло на лекаря
          </h1>
          {doctorProfile && (
            <p className="text-sm text-muted">
              {doctorProfile.name} — {doctorProfile.specialty}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowSlotForm(!showSlotForm)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
        >
          {showSlotForm ? "Затвори" : "Генерирай часове"}
        </button>
      </div>

      {/* Slot generation form */}
      {showSlotForm && (
        <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">
            Генериране на свободни часове
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-muted">
                От дата
              </label>
              <input
                type="date"
                value={slotForm.startDate}
                onChange={(e) =>
                  setSlotForm((p) => ({ ...p, startDate: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">
                До дата
              </label>
              <input
                type="date"
                value={slotForm.endDate}
                onChange={(e) =>
                  setSlotForm((p) => ({ ...p, endDate: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">
                Начален час
              </label>
              <select
                value={slotForm.startHour}
                onChange={(e) =>
                  setSlotForm((p) => ({
                    ...p,
                    startHour: Number(e.target.value),
                  }))
                }
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {Array.from({ length: 14 }, (_, i) => i + 7).map((h) => (
                  <option key={h} value={h}>
                    {h}:00
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">
                Краен час
              </label>
              <select
                value={slotForm.endHour}
                onChange={(e) =>
                  setSlotForm((p) => ({
                    ...p,
                    endHour: Number(e.target.value),
                  }))
                }
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {Array.from({ length: 14 }, (_, i) => i + 8).map((h) => (
                  <option key={h} value={h}>
                    {h}:00
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-muted">
                Продължителност (мин)
              </label>
              <select
                value={slotForm.slotDuration}
                onChange={(e) =>
                  setSlotForm((p) => ({
                    ...p,
                    slotDuration: Number(e.target.value),
                  }))
                }
                className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value={15}>15 мин</option>
                <option value={30}>30 мин</option>
                <option value={45}>45 мин</option>
                <option value={60}>60 мин</option>
              </select>
            </div>
            <button
              onClick={handleGenerateSlots}
              disabled={
                generatingSlots || !slotForm.startDate || !slotForm.endDate
              }
              className="mt-5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {generatingSlots ? "Генериране..." : "Генерирай"}
            </button>
          </div>
        </div>
      )}

      {slotMessage && (
        <div className="mt-4 rounded-lg bg-accent border border-border p-3 text-sm text-foreground">
          {slotMessage}
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-800">{pending.length}</p>
          <p className="text-xs text-yellow-600">Чакащи</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <p className="text-2xl font-bold text-green-800">
            {confirmed.length}
          </p>
          <p className="text-xs text-green-600">Предстоящи</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-muted">
            {pastOrCancelled.length}
          </p>
          <p className="text-xs text-muted">Минали / Отменени</p>
        </div>
      </div>

      {/* Pending bookings */}
      {pending.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">
            Чакащи потвърждение
          </h2>
          <div className="mt-3 space-y-3">
            {pending.map((booking) => (
              <DoctorBookingCard
                key={booking._id}
                booking={booking}
                onUpdate={handleUpdateStatus}
                updating={updatingId === booking._id}
                showActions
              />
            ))}
          </div>
        </div>
      )}

      {/* Confirmed upcoming */}
      {confirmed.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">
            Предстоящи прегледи
          </h2>
          <div className="mt-3 space-y-3">
            {confirmed.map((booking) => (
              <DoctorBookingCard
                key={booking._id}
                booking={booking}
                onUpdate={handleUpdateStatus}
                updating={updatingId === booking._id}
                showActions
              />
            ))}
          </div>
        </div>
      )}

      {/* Past / cancelled */}
      {pastOrCancelled.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-muted">
            Минали / Отменени
          </h2>
          <div className="mt-3 space-y-3 opacity-70">
            {pastOrCancelled.map((booking) => (
              <DoctorBookingCard
                key={booking._id}
                booking={booking}
                onUpdate={handleUpdateStatus}
                updating={updatingId === booking._id}
                showActions={false}
              />
            ))}
          </div>
        </div>
      )}

      {bookings.length === 0 && (
        <p className="mt-8 text-center text-muted">
          Все още нямате резервации.
        </p>
      )}
    </div>
  );
}

function DoctorBookingCard({
  booking,
  onUpdate,
  updating,
  showActions,
}: {
  booking: Booking;
  onUpdate: (id: string, status: string) => void;
  updating: boolean;
  showActions: boolean;
}) {
  const statusInfo = STATUS_LABELS[booking.status];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-semibold text-foreground">
            {booking.patientId.name}
          </p>
          <p className="text-xs text-muted">{booking.patientId.email}</p>
          {booking.patientId.phone && (
            <p className="text-xs text-muted">
              Тел: {booking.patientId.phone}
            </p>
          )}
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
          Бележки от пациента: {booking.notes}
        </p>
      )}

      {showActions && booking.status !== "cancelled" && (
        <div className="mt-3 flex gap-2">
          {booking.status === "pending" && (
            <button
              onClick={() => onUpdate(booking._id, "confirmed")}
              disabled={updating}
              className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {updating ? "..." : "Потвърди"}
            </button>
          )}
          <button
            onClick={() => onUpdate(booking._id, "cancelled")}
            disabled={updating}
            className="rounded-lg border border-red-200 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {updating ? "..." : "Отмени"}
          </button>
        </div>
      )}
    </div>
  );
}
