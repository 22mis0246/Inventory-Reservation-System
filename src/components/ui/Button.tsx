"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "lane";

const variants: Record<Variant, string> = {
  primary:
    "bg-hold-accent text-white hover:bg-hold-accent/90 disabled:opacity-50",
  ghost:
    "border border-hold-ink/15 bg-white/80 hover:bg-white disabled:opacity-50",
  lane: "bg-hold-ink text-white hover:bg-hold-ink/90 disabled:opacity-40",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
