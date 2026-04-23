"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Calendar, Eye } from "lucide-react";

interface Lead {
  id: string; name: string; restaurantName: string | null; email: string;
  phone: string | null; city: string | null; message: string | null;
  source: string; isRead: boolean; createdAt: string | Date;
}

export function LeadsClient({ leads: initial }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initial);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("unread");

  const displayed = filter === "unread" ? leads.filter((l) => !l.isRead) : leads;
  const unreadCount = leads.filter((l) => !l.isRead).length;

  async function markRead(lead: Lead) {
    if (lead.isRead) { setSelected(lead); return; }
    try {
      await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, isRead: true }),
      });
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, isRead: true } : l)));
      setSelected({ ...lead, isRead: true });
    } catch {
      toast.error("Erreur lors du marquage comme lu");
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="flex gap-2 mb-4">
          {[
            { key: "unread" as const, label: `Non lus (${unreadCount})` },
            { key: "all" as const, label: `Tous (${leads.length})` },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filter === f.key ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {displayed.length === 0 ? (
            <div className="bg-slate-800 rounded-2xl p-8 text-center text-slate-500">
              {filter === "unread" ? "Tous les contacts ont été lus" : "Aucun contact"}
            </div>
          ) : (
            displayed.map((lead) => (
              <button key={lead.id} onClick={() => markRead(lead)}
                className={`w-full text-left bg-slate-800 hover:bg-slate-700 border rounded-2xl p-4 transition-all ${selected?.id === lead.id ? "border-indigo-500" : lead.isRead ? "border-slate-700" : "border-indigo-500/30"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {!lead.isRead && <div className="w-2 h-2 bg-indigo-400 rounded-full shrink-0" />}
                      <p className="font-semibold text-white text-sm truncate">{lead.name}</p>
                    </div>
                    {lead.restaurantName && <p className="text-xs text-slate-400 truncate">{lead.restaurantName}</p>}
                    <p className="text-xs text-slate-500 truncate">{lead.email}</p>
                  </div>
                  <p className="text-xs text-slate-600 shrink-0">{new Date(lead.createdAt).toLocaleDateString("fr-DZ")}</p>
                </div>
                {lead.message && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{lead.message}</p>}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        {selected ? (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-7">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-white">{selected.name}</h2>
                {selected.restaurantName && <p className="text-slate-400 text-sm">{selected.restaurantName}</p>}
              </div>
              <div className="flex items-center gap-2">
                {selected.isRead && (
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Lu
                  </span>
                )}
                <span className="text-xs text-slate-600 bg-slate-700 px-2 py-1 rounded-lg">{selected.source}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { icon: Mail, label: "Email", val: selected.email },
                { icon: Phone, label: "Téléphone", val: selected.phone || "—" },
                { icon: MapPin, label: "Ville", val: selected.city || "—" },
                { icon: Calendar, label: "Date", val: new Date(selected.createdAt).toLocaleString("fr-DZ") },
              ].map((row) => (
                <div key={row.label} className="bg-slate-900/50 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <row.icon className="w-3.5 h-3.5 text-slate-500" />
                    <p className="text-xs text-slate-500">{row.label}</p>
                  </div>
                  <p className="text-sm text-white font-medium">{row.val}</p>
                </div>
              ))}
            </div>
            {selected.message && (
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-2">Message</p>
                <p className="text-sm text-slate-200 leading-relaxed">{selected.message}</p>
              </div>
            )}
            <div className="mt-5 pt-5 border-t border-slate-700">
              <a href={`mailto:${selected.email}`}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all">
                <Mail className="w-4 h-4" /> Répondre par email
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-16 text-center">
            <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-slate-500">Sélectionnez un contact pour voir les détails</p>
          </div>
        )}
      </div>
    </div>
  );
}
