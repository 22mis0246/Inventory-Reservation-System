"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProductDto } from "@/types/api";
import { createReservation, ApiClientError } from "@/lib/client-api";
import { useToast } from "@/components/Toast";
import { WarehouseLane } from "@/components/WarehouseLane";

type Props = {
  product: ProductDto;
};

export function ProductCard({ product }: Props) {
  const router = useRouter();
  const { push: toast } = useToast();
  const queryClient = useQueryClient();
  const [shakeCode, setShakeCode] = useState<string | null>(null);
  const [activeLane, setActiveLane] = useState<string | null>(null);

  const reserve = useMutation({
    mutationFn: createReservation,
    onSuccess: (reservation) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        kind: "success",
        title: "Hold placed",
        detail: `10 minutes to complete checkout for ${product.name}.`,
      });
      router.push(`/checkout/${reservation.id}`);
    },
    onError: (err, variables) => {
      const wh = product.warehouses.find(
        (w) => w.warehouseId === variables.warehouseId,
      );
      if (err instanceof ApiClientError && err.status === 409) {
        setShakeCode(wh?.code ?? null);
        setTimeout(() => setShakeCode(null), 500);
        toast({
          kind: "error",
          title: "Someone got there first",
          detail:
            err.body.available !== undefined
              ? `Only ${err.body.available} unit(s) left at ${wh?.code ?? "this warehouse"}.`
              : err.message,
        });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        return;
      }
      toast({
        kind: "error",
        title: "Could not reserve",
        detail: err instanceof Error ? err.message : "Try again",
      });
    },
    onSettled: () => setActiveLane(null),
  });

  return (
    <article className="overflow-hidden rounded-xl border border-hold-ink/10 bg-white/80 shadow-sm">
      <div className="grid gap-0 sm:grid-cols-[140px_1fr]">
        <div className="relative aspect-square bg-hold-ink/5 sm:aspect-auto sm:min-h-[140px]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="140px"
            />
          ) : (
            <div className="flex h-full min-h-[140px] items-center justify-center font-mono text-xs text-hold-muted">
              No image
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="mb-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-hold-muted">
              {product.sku}
            </p>
            <h2 className="text-lg font-semibold leading-tight">{product.name}</h2>
            {product.description ? (
              <p className="mt-1 text-sm text-hold-muted line-clamp-2">
                {product.description}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {product.warehouses.map((wh) => (
              <WarehouseLane
                key={wh.warehouseId}
                stock={wh}
                shake={shakeCode === wh.code}
                loading={
                  activeLane === wh.warehouseId && reserve.isPending
                }
                onReserve={() => {
                  setActiveLane(wh.warehouseId);
                  reserve.mutate({
                    productId: product.id,
                    warehouseId: wh.warehouseId,
                    quantity: 1,
                  });
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
