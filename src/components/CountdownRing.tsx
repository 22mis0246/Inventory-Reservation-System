"use client";

import { useEffect, useState } from "react";

type Urgency = "ok" | "warn" | "critical" | "expired";

const strokeByUrgency: Record<Urgency, string> = {
  ok: "var(--hold-mint)",
  warn: "var(--hold-warn)",
  critical: "var(--hold-danger)",
  expired: "var(--hold-muted)",
};

type Props = {
  expiresAt: string;
  totalMs: number;
};

function getUrgency(remainingMs: number, totalMs: number): Urgency {
  if (remainingMs <= 0) return "expired";
  const twoMin = 2 * 60 * 1000;
  const fiveMin = 5 * 60 * 1000;
  if (remainingMs <= twoMin) return "critical";
  if (remainingMs <= fiveMin || remainingMs / totalMs < 0.25) return "warn";
  return "ok";
}

function formatClock(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CountdownRing({ expiresAt, totalMs }: Props) {
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, new Date(expiresAt).getTime() - Date.now()),
  );

  useEffect(() => {
    const tick = () => {
      setRemainingMs(
        Math.max(0, new Date(expiresAt).getTime() - Date.now()),
      );
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [expiresAt]);

  const urgency = getUrgency(remainingMs, totalMs);
  const progress =
    totalMs > 0 ? Math.min(1, Math.max(0, remainingMs / totalMs)) : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative mx-auto h-36 w-36" role="timer" aria-live="polite">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--hold-ink)"
          strokeOpacity={0.08}
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={strokeByUrgency[urgency]}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset,stroke] duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-bold tabular-nums">
          {formatClock(remainingMs)}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-hold-muted">
          {urgency === "expired" ? "Expired" : "remaining"}
        </span>
      </div>
    </div>
  );
}
