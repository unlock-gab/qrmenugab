import { prisma } from "@/lib/prisma";
import { LeadsClient } from "./LeadsClient";

export const metadata = { title: "Contacts — Admin" };

export default async function AdminLeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
  });

  const plural = leads.length > 1 ? "contacts" : "contact";

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Contacts & Demandes de démo</h1>
        <p className="text-slate-400 mt-1">{leads.length} {plural} reçu{leads.length > 1 ? "s" : ""} via le formulaire de contact</p>
      </div>
      <LeadsClient leads={leads} />
    </div>
  );
}
