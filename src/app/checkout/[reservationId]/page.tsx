import { HoldTicketCheckout } from "@/components/HoldTicketCheckout";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ reservationId: string }>;
}) {
  const { reservationId } = await params;
  return <HoldTicketCheckout reservationId={reservationId} />;
}
