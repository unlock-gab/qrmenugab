import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "PLATFORM_ADMIN") redirect("/dashboard");

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      <AdminSidebar user={session.user} />
      <main className="flex-1 overflow-auto bg-slate-900">
        {children}
      </main>
    </div>
  );
}
