"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchReservation,
  confirmReservationApi,
  releaseReservationApi,
  ApiClientError,
} from "@/lib/client-api";
import { CountdownRing } from "@/components/CountdownRing";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/Toast";

const laneColor: Record<string, string> = {
  BLR: "var(--lane-blr)",
  DEL: "var(--lane-del)",
  BOM: "var(--lane-bom)",
};

type Props = {
  reservationId: string;
};

export function HoldTicketCheckout({ reservationId }: Props) {
  const router = useRouter();
  const { push: toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["reservation", reservationId],
    queryFn: () => fetchReservation(reservationId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && status !== "PENDING") return false;
      return 3_000;
    },
  });

  const confirm = useMutation({
    mutationFn: () => confirmReservationApi(reservationId),
    onSuccess: (reservation) => {
      queryClient.setQueryData(["reservation", reservationId], reservation);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        kind: "success",
        title: "Purchase confirmed",
        detail: "Stock permanently allocated. Thanks!",
      });
    },
    onError: (err) => {
      if (err instanceof ApiClientError && err.status === 410) {
        toast({
          kind: "error",
          title: "Hold expired",
          detail:
            "This reservation timed out. Stock was returned — pick another lane.",
        });
        refetch();
        queryClient.invalidateQueries({ queryKey: ["products"] });
        return;
      }
      toast({
        kind: "error",
        title: "Could not confirm",
        detail: err instanceof Error ? err.message : "Try again",
      });
    },
  });

  const cancel = useMutation({
    mutationFn: () => releaseReservationApi(reservationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        kind: "info",
        title: "Hold cancelled",
        detail: "Units returned to the shelf.",
      });
      router.push("/");
    },
    onError: (err) => {
      toast({
        kind: "error",
        title: "Could not cancel",
        detail: err instanceof Error ? err.message : "Try again",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md animate-pulse rounded-xl bg-hold-ink/5 p-12" />
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-hold-danger/30 bg-hold-danger/10 p-6 text-center">
        <p className="font-semibold">Hold not found</p>
        <p className="mt-2 text-sm text-hold-muted">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <Link href="/" className="mt-4 inline-block text-sm text-hold-accent underline">
          Back to shelf
        </Link>
      </div>
    );
  }

  const totalMs = Math.max(
    60_000,
    new Date(data.expiresAt).getTime() - new Date(data.createdAt).getTime(),
  );
  const whCode = data.warehouse?.code ?? "—";
  const stampColor = laneColor[whCode] ?? "var(--hold-muted)";
  const isPending = data.status === "PENDING";
  const isConfirmed = data.status === "CONFIRMED";
  const isReleased = data.status === "RELEASED";
  const expired =
    isReleased ||
    (isPending && new Date(data.expiresAt).getTime() <= Date.now());

  return (
    <div className="mx-auto max-w-md">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-hold-accent">
        Checkout hold ticket
      </p>

      <article className="relative overflow-hidden rounded-xl border-2 border-hold-ink/15 bg-[#fffef9] shadow-md">
        {/* perforated top */}
        <div className="flex justify-center gap-1 border-b border-dashed border-hold-ink/20 bg-hold-ink/[0.03] py-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-hold-ink/10"
              aria-hidden
            />
          ))}
        </div>

        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] text-hold-muted">HOLD ID</p>
              <p className="font-mono text-sm font-semibold break-all">
                {data.id}
              </p>
            </div>
            <div
              className="rounded border-2 px-2 py-1 font-mono text-xs font-bold uppercase"
              style={{ borderColor: stampColor, color: stampColor }}
            >
              {whCode}
            </div>
          </div>

          <div className="mb-4 flex gap-4">
            {data.product?.imageUrl ? (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-hold-ink/10">
                <Image
                  src={data.product.imageUrl}
                  alt={data.product.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            ) : null}
            <div>
              <p className="font-mono text-[10px] text-hold-muted">
                {data.product?.sku}
              </p>
              <h1 className="text-lg font-semibold leading-tight">
                {data.product?.name}
              </h1>
              <p className="mt-1 text-sm text-hold-muted">
                {data.warehouse?.name} · Qty {data.quantity}
              </p>
            </div>
          </div>

          {isPending && !expired ? (
            <CountdownRing expiresAt={data.expiresAt} totalMs={totalMs} />
          ) : null}

          {expired && !isConfirmed ? (
            <div className="rounded-lg border border-hold-danger/30 bg-hold-danger/10 p-4 text-center">
              <p className="font-semibold text-hold-danger">Hold expired</p>
              <p className="mt-1 text-sm text-hold-muted">
                Payment window closed. Stock is back on the shelf.
              </p>
              <Link
                href="/"
                className="mt-3 inline-block text-sm font-medium text-hold-accent underline"
              >
                Return to shelf
              </Link>
            </div>
          ) : null}

          {isConfirmed ? (
            <div className="rounded-lg border border-hold-mint/30 bg-hold-mint/10 p-4 text-center">
              <p className="font-semibold text-hold-mint">Confirmed</p>
              <p className="mt-1 text-sm text-hold-muted">
                Order complete — inventory permanently decremented.
              </p>
              <Link
                href="/"
                className="mt-3 inline-block text-sm font-medium text-hold-accent underline"
              >
                Back to shelf
              </Link>
            </div>
          ) : null}

          {isPending && !expired ? (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button
                variant="primary"
                className="flex-1 py-2.5"
                disabled={confirm.isPending || cancel.isPending}
                onClick={() => confirm.mutate()}
              >
                {confirm.isPending ? "Confirming…" : "Confirm purchase"}
              </Button>
              <Button
                variant="ghost"
                className="flex-1 py-2.5"
                disabled={confirm.isPending || cancel.isPending}
                onClick={() => cancel.mutate()}
              >
                {cancel.isPending ? "Cancelling…" : "Cancel hold"}
              </Button>
            </div>
          ) : null}
        </div>

        {/* barcode strip */}
        <div className="border-t border-hold-ink/10 bg-hold-ink/[0.04] px-6 py-3">
          <div className="flex h-8 items-end justify-center gap-px opacity-60">
            {data.id.split("").map((ch, i) => (
              <span
                key={`${ch}-${i}`}
                className="bg-hold-ink"
                style={{
                  width: 2,
                  height: `${12 + (ch.charCodeAt(0) % 5) * 4}px`,
                }}
                aria-hidden
              />
            ))}
          </div>
          <p className="mt-1 text-center font-mono text-[9px] text-hold-muted">
            HOLD DESK · {new Date(data.createdAt).toLocaleString()}
          </p>
        </div>
      </article>
    </div>
  );
}
