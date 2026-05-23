"use client";

import { QueryProvider } from "./QueryProvider";
import { ToastProvider } from "@/components/Toast";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>{children}</ToastProvider>
    </QueryProvider>
  );
}
