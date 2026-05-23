"use client";

import type { WarehouseStock } from "@/types/api";
import { Button } from "@/components/ui/Button";

const laneColor: Record<string, string> = {
  BLR: "var(--lane-blr)",
  DEL: "var(--lane-del)",
  BOM: "var(--lane-bom)",
};

type Props = {
  stock: WarehouseStock;
  loading: boolean;
  shake?: boolean;
  onReserve: () => void;
};

export function WarehouseLane({ stock, loading, shake, onReserve }: Props) {
  const color = laneColor[stock.code] ?? "var(--hold-muted)";
  const pct =
    stock.totalQuantity > 0
      ? Math.round((stock.available / stock.totalQuantity) * 100)
      : 0;
  const scarce = stock.available > 0 && stock.available <= 3;
  const empty = stock.available === 0;

  return (
    <div
      className={`rounded-md border border-hold-ink/10 bg-white/70 p-3 transition ${shake ? "animate-shake" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <span className="font-mono text-xs font-semibold">{stock.code}</span>
          <span className="text-xs text-hold-muted">{stock.name}</span>
        </div>
        {scarce && !empty ? (
          <span className="rounded bg-hold-warn/15 px-1.5 py-0.5 font-mono text-[10px] text-hold-warn">
            {stock.available} left
          </span>
        ) : null}
      </div>

      <div className="mb-1 h-2 overflow-hidden rounded-full bg-hold-ink/8">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="mb-2 font-mono text-[11px] text-hold-muted">
        {stock.available} available · {stock.reservedQuantity} held ·{" "}
        {stock.totalQuantity} total
      </p>

      <Button
        variant="lane"
        disabled={empty || loading}
        onClick={onReserve}
        className="w-full text-xs"
        style={empty ? undefined : { backgroundColor: color }}
      >
        {loading ? "Holding…" : empty ? "Out of stock" : "Reserve 1 unit"}
      </Button>
    </div>
  );
}
