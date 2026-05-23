import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Hold Desk — Multi-warehouse inventory holds",
  description:
    "Reserve stock across warehouses during checkout. 10-minute holds, race-safe allocation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${jetbrains.variable} min-h-screen antialiased`}
      >
        <header className="border-b border-hold-ink/10 bg-white/60 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md bg-hold-accent font-mono text-sm font-bold text-white"
                aria-hidden
              >
                HD
              </div>
              <div>
                <p className="font-semibold tracking-tight">Hold Desk</p>
                <p className="text-xs text-hold-muted">
                  Inventory holds · 10 min window
                </p>
              </div>
            </div>
            <span className="hidden rounded-full border border-hold-ink/15 px-3 py-1 font-mono text-xs text-hold-muted sm:inline">
              Allo take-home
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">
          <AppProviders>{children}</AppProviders>
        </main>
      </body>
    </html>
  );
}
