import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Намерете <span className="text-primary">лекар</span> за вас
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted">
          Търсете специалисти по специалност, град и болница. Вижте свободни
          часове и запишете час за преглед бързо и лесно.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-4">
          <Link
            href="/doctors"
            className="rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-dark transition-colors"
          >
            Разгледай лекарите →
          </Link>
        </div>
      </div>

      <div className="mt-20 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-2xl">
            🔍
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            Търсене
          </h3>
          <p className="mt-2 text-sm text-muted">
            Филтрирайте по специалност, град, цена и рейтинг.
          </p>
        </div>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-2xl">
            📋
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            Профили
          </h3>
          <p className="mt-2 text-sm text-muted">
            Вижте подробна информация за всеки лекар.
          </p>
        </div>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-2xl">
            📅
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            Свободни часове
          </h3>
          <p className="mt-2 text-sm text-muted">
            Проверете наличността и запишете час веднага.
          </p>
        </div>
      </div>
    </div>
  );
}
