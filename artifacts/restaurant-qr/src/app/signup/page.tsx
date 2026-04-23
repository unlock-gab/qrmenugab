import { SignupClient } from "./SignupClient";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Create Account — QRMenu" };

async function getPublicPlans() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    });
    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price ? Number(p.price) : null,
      displayPrice: p.displayPrice,
      billingInterval: p.billingInterval,
      maxTables: p.maxTables,
      maxMenuItems: p.maxMenuItems,
      maxStaffUsers: p.maxStaffUsers,
      isFeatured: p.isFeatured,
      sortOrder: p.sortOrder,
    }));
  } catch {
    return [];
  }
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const session = await getServerSession(authOptions);
  if (session) {
    const role = (session.user as any).role;
    if (role === "PLATFORM_ADMIN") redirect("/admin/dashboard");
    else redirect("/dashboard");
  }

  const plans = await getPublicPlans();
  const params = await searchParams;
  const selectedPlanId = params?.plan;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col items-center justify-center py-16 px-5">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200">
              <span className="text-white text-sm font-bold">Q</span>
            </div>
            <span className="font-black text-gray-900 text-xl tracking-tight">QRMenu</span>
          </Link>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Start your free trial</h1>
          <p className="text-gray-500">14 days free. No credit card required.</p>
        </div>

        <SignupClient plans={plans} selectedPlanId={selectedPlanId} />

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-orange-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
