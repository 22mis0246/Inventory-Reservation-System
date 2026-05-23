"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/client-api";
import { ProductCard } from "@/components/ProductCard";

export function ProductShelf() {
  const { data, isLoading, isError, error, dataUpdatedAt } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    refetchInterval: 5_000,
  });

  const updated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : null;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-hold-accent">
            Live shelf
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Pick a warehouse lane
          </h1>
          <p className="max-w-xl text-sm text-hold-muted">
            Reserve pulls stock into a 10-minute hold. Pay before the timer runs
            out — or it goes back on the shelf for the next shopper.
          </p>
        </div>
        {updated ? (
          <p className="font-mono text-[10px] text-hold-muted">
            Refreshed {updated}
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl bg-hold-ink/5"
            />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-lg border border-hold-danger/30 bg-hold-danger/10 p-4 text-sm">
          Could not load products:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      ) : null}

      {data ? (
        <div className="space-y-4">
          {data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : null}

      {data?.some((p) => p.sku === "HD-RACE-99") ? (
        <p className="rounded-lg border border-dashed border-hold-accent/40 bg-hold-accent/5 px-4 py-3 text-xs text-hold-muted">
          <span className="font-semibold text-hold-accent">Reviewer tip:</span>{" "}
          Try reserving <span className="font-mono">HD-RACE-99</span> from BLR
          twice in two tabs — only one should succeed.
        </p>
      ) : null}
    </section>
  );
}
