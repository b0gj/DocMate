import { Suspense } from "react";
import DoctorCard from "@/components/DoctorCard";
import SearchFilters from "@/components/SearchFilters";
import Pagination from "@/components/Pagination";

interface DoctorsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

async function fetchDoctors(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/doctors?${query.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Грешка при зареждане на лекари");
  return res.json();
}

export default async function DoctorsPage({ searchParams }: DoctorsPageProps) {
  const params = await searchParams;
  const data = await fetchDoctors(params);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Каталог с лекари
        </h1>
        <p className="mt-1 text-sm text-muted">
          Намерете специалист и запишете час за преглед
        </p>
      </div>

      <Suspense fallback={<div className="text-sm text-muted">Зареждане...</div>}>
        <SearchFilters />
      </Suspense>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.doctors.map(
          (doctor: {
            _id: string;
            name: string;
            specialty: string;
            city: string;
            hospital: string;
            price: number;
            rating: number;
            imageUrl?: string;
            nextAvailableSlot?: string | null;
          }) => (
            <DoctorCard key={doctor._id} doctor={doctor} />
          )
        )}
      </div>

      {data.doctors.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-lg text-muted">Няма намерени лекари</p>
          <p className="mt-1 text-sm text-muted">
            Опитайте с различни филтри
          </p>
        </div>
      )}

      <div className="mt-8">
        <Suspense fallback={null}>
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
          />
        </Suspense>
      </div>
    </div>
  );
}
