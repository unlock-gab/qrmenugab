import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StaffClient } from "@/components/dashboard/StaffClient";

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "MERCHANT_OWNER") redirect("/dashboard");
  return <StaffClient />;
}
