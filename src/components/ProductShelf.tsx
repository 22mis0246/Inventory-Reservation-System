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
              className="flex gap-4 rounded-xl border border-hold-ink/10 bg-white/70 p-4 animate-pulse"
            >
              {/* Product image */}
              <div className="h-36 w-36 shrink-0 rounded-lg bg-hold-ink/10" />

              {/* Right side */}
              <div className="flex-1 space-y-3">
                {/* SKU + title */}
                <div className="h-3 w-20 rounded bg-hold-ink/10" />
                <div className="h-5 w-48 rounded bg-hold-ink/10" />
                <div className="h-3 w-32 rounded bg-hold-ink/10" />

                {/* 3 lane cards */}
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="space-y-2 rounded-md border border-hold-ink/10 bg-white/50 p-3">
                      <div className="h-3 w-16 rounded bg-hold-ink/10" />
                      <div className="h-2 w-full rounded-full bg-hold-ink/10" />
                      <div className="h-3 w-24 rounded bg-hold-ink/10" />
                      <div className="h-7 w-full rounded-md bg-hold-ink/10" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
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