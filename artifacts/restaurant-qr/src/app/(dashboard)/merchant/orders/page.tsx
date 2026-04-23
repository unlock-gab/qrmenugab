import { OrdersClient } from "@/components/dashboard/OrdersClient";

// Thin page — no server-side DB query.
// OrdersClient fetches /api/orders immediately on mount and polls every 8s.
export default function OrdersPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <OrdersClient />
    </div>
  );
}
