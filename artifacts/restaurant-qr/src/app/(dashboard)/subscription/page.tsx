import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SubscriptionClient } from "@/components/dashboard/SubscriptionClient";

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!["MERCHANT_OWNER", "MERCHANT_STAFF"].includes(session.user.role ?? "")) redirect("/dashboard");
  return <SubscriptionClient />;
}
