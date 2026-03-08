import Link from "next/link";

interface DoctorCardProps {
  doctor: {
    _id: string;
    name: string;
    specialty: string;
    city: string;
    hospital: string;
    price: number;
    rating: number;
    imageUrl?: string;
    nextAvailableSlot?: string | null;
  };
}

export default function DoctorCard({ doctor }: DoctorCardProps) {
  const nextSlot = doctor.nextAvailableSlot
    ? new Date(doctor.nextAvailableSlot)
    : null;

  return (
    <Link
      href={`/doctors/${doctor._id}`}
      className="group block rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-2xl">
          🩺
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
            {doctor.name}
          </h3>
          <p className="text-sm text-primary font-medium">{doctor.specialty}</p>
          <p className="mt-1 text-sm text-muted truncate">
            {doctor.hospital}, {doctor.city}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">
            {doctor.price} лв.
          </span>
          <span className="flex items-center gap-1 text-sm text-rating">
            ★ {doctor.rating.toFixed(1)}
          </span>
        </div>
        {nextSlot ? (
          <span className="text-xs text-muted">
            Свободен:{" "}
            {nextSlot.toLocaleDateString("bg-BG", {
              day: "numeric",
              month: "short",
            })}{" "}
            {nextSlot.toLocaleTimeString("bg-BG", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ) : (
          <span className="text-xs text-muted">Няма свободни часове</span>
        )}
      </div>
    </Link>
  );
}
