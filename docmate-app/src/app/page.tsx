import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-[family-name:var(--font-geist-sans)]">
      <main className="flex w-full max-w-3xl flex-col items-center justify-between py-20 px-16 bg-white shadow-xl rounded-2xl sm:items-start text-center sm:text-left">
        <div className="flex flex-col gap-6 w-full">
          <h1 className="text-5xl font-extrabold text-blue-700 tracking-tight">
            DocMate
          </h1>
          <p className="text-xl text-zinc-600 font-medium">
            Find the perfect doctor for you. Book appointments easily.
          </p>
          
          <div className="mt-8">
            <Link 
              href="/doctors" 
              className="inline-flex h-14 items-center justify-center rounded-full bg-blue-600 px-8 font-semibold text-white transition-colors hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transform duration-200"
            >
              Search Doctors Now ✨
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
