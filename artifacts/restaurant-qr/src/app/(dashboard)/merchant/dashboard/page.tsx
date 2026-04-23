import { DashboardOverviewClient } from "@/components/dashboard/DashboardOverviewClient";

// Thin page — no server-side DB queries.
// DashboardOverviewClient fetches /api/dashboard/stats on mount and refreshes every 15s.
export default function DashboardPage() {
  return <DashboardOverviewClient />;
}
