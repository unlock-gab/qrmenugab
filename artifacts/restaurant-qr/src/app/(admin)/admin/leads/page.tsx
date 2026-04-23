import { prisma } from "@/lib/prisma";
import { LeadsClient } from "./LeadsClient";

export const metadata = { title: "Leads — Admin" };

export default async function AdminLeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Leads & Demo Requests</h1>
        <p className="text-slate-400 mt-1">{leads.length} total lead{leads.length !== 1 ? "s" : ""} from the contact form</p>
      </div>
      <LeadsClient leads={leads} />
    </div>
  );
}
