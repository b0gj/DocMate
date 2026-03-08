import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocMate — Намерете лекар",
  description:
    "Платформа за търсене на лекари и записване на часове за преглед.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
          <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">🩺</span>
              <span className="text-xl font-bold text-foreground">
                Doc<span className="text-primary">Mate</span>
              </span>
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/doctors"
                className="text-sm font-medium text-muted hover:text-primary transition-colors"
              >
                Лекари
              </Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
