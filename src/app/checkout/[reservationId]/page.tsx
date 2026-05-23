/** Placeholder — full hold ticket UI in Stage 8 */
export default async function CheckoutPlaceholder({
  params,
}: {
  params: Promise<{ reservationId: string }>;
}) {
  const { reservationId } = await params;
  return (
    <p className="font-mono text-sm text-hold-muted">
      Hold ticket for {reservationId} — Stage 8 next
    </p>
  );
}
