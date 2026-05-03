"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, Clock, RefreshCw } from "lucide-react";

interface WaiterRequest {
  id: string;
  type: "CALL_WAITER" | "REQUEST_BILL" | "HELP";
  status: "PENDING" | "HANDLED";
  createdAt: string;
  table: { tableNumber: string } | null;
  branch?: { name: string } | null;
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  CALL_WAITER:  { label: "Appel serveur",   icon: "🙋", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  REQUEST_BILL: { label: "Demande addition", icon: "🧾", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  HELP:         { label: "Aide requise",     icon: "❓", color: "text-red-700",    bg: "bg-red-50 border-red-200" },
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  return `${Math.floor(diff / 3600)}h`;
}

function urgencyClass(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins >= 5) return "ring-2 ring-red-400 ring-offset-1";
  if (mins >= 2) return "ring-2 ring-amber-400 ring-offset-1";
  return "";
}

export default function ServicePage() {
  const [requests, setRequests] = useState<WaiterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [handlingId, setHandlingId] = useState<string | null>(null);
  const [showHandled, setShowHandled] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchRequests = useCallback(async () => {
    try {
      const url = showHandled ? "/api/waiter-requests" : "/api/waiter-requests?status=PENDING";
      const res = await fetch(url);
      if (res.ok) setRequests(await res.json());
      setLastRefresh(new Date());
    } finally { setLoading(false); }
  }, [showHandled]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 8000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleRequest = async (id: string) => {
    setHandlingId(id);
    await fetch(`/api/waiter-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "HANDLED" }),
    });
    setHandlingId(null);
    fetchRequests();
  };

  const handleAll = async () => {
    const pending = requests.filter((r) => r.status === "PENDING");
    await Promise.all(
      pending.map((r) =>
        fetch(`/api/waiter-requests/${r.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "HANDLED" }),
        })
      )
    );
    fetchRequests();
  };

  const pending = requests.filter((r) => r.status === "PENDING");
  const handled = requests.filter((r) => r.status === "HANDLED");

  // Group pending by type
  const grouped = {
    CALL_WAITER: pending.filter((r) => r.type === "CALL_WAITER"),
    REQUEST_BILL: pending.filter((r) => r.type === "REQUEST_BILL"),
    HELP: pending.filter((r) => r.type === "HELP"),
  } as Record<string, WaiterRequest[]>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500" /> Espace Service
          </h1>
          <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-2">
            <RefreshCw className="w-3 h-3" />
            Actualisé à {lastRefresh.toLocaleTimeString("fr-DZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse inline-block" />
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pending.length > 1 && (
            <button
              onClick={handleAll}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition"
            >
              <CheckCheck className="w-4 h-4" /> Tout traiter ({pending.length})
            </button>
          )}
          <button
            onClick={() => setShowHandled(!showHandled)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${
              showHandled ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {showHandled ? "Masquer traités" : "Voir traités"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className={`rounded-2xl p-4 text-center border-2 ${pending.length > 0 ? "bg-amber-50 border-amber-300" : "bg-gray-50 border-gray-200"}`}>
          <p className={`text-3xl font-black ${pending.length > 0 ? "text-amber-600" : "text-gray-400"}`}>{pending.length}</p>
          <p className="text-sm font-semibold text-gray-600 mt-0.5">En attente</p>
          {pending.length > 0 && <span className="text-xs text-amber-600 font-medium">⚠ Action requise</span>}
        </div>
        <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
          <p className="text-3xl font-black text-gray-700">{grouped.REQUEST_BILL.length}</p>
          <p className="text-sm font-semibold text-gray-500 mt-0.5">Additions</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
          <p className="text-3xl font-black text-emerald-600">{handled.length}</p>
          <p className="text-sm font-semibold text-gray-500 mt-0.5">Traitées aujourd'hui</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : pending.length === 0 && !showHandled ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center">
          <CheckCheck className="w-14 h-14 text-emerald-300 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold text-lg">Tout est traité ✓</p>
          <p className="text-gray-400 text-sm mt-1">Aucune demande de service en attente</p>
          <p className="text-gray-400 text-xs mt-3">Actualisation automatique toutes les 8 secondes</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending by type */}
          {(["HELP", "REQUEST_BILL", "CALL_WAITER"] as const).map((type) => {
            const items = grouped[type];
            if (items.length === 0) return null;
            const cfg = TYPE_CONFIG[type];
            return (
              <div key={type}>
                <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${cfg.color}`}>
                  <span className="text-base">{cfg.icon}</span> {cfg.label} <span className="bg-gray-900 text-white text-xs rounded-full px-2 py-0.5 font-bold">{items.length}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((r) => (
                    <div key={r.id} className={`bg-white rounded-2xl border p-4 flex flex-col gap-3 ${cfg.bg} ${urgencyClass(r.createdAt)} transition-all`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{cfg.icon}</span>
                            <div>
                              <p className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</p>
                              {r.table && <p className="text-gray-600 text-xs font-semibold">Table {r.table.tableNumber}</p>}
                              {r.branch && <p className="text-gray-400 text-xs">{r.branch.name}</p>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                          <Clock className="w-3 h-3" /> {timeAgo(r.createdAt)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRequest(r.id)}
                        disabled={handlingId === r.id}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <CheckCheck className="w-4 h-4" />
                        {handlingId === r.id ? "Traitement…" : "Traité ✓"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Handled list */}
          {showHandled && handled.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                <CheckCheck className="w-4 h-4" /> Demandes traitées
              </h2>
              <div className="space-y-2">
                {handled.slice(0, 20).map((r) => {
                  const cfg = TYPE_CONFIG[r.type];
                  return (
                    <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 opacity-60">
                      <span className="text-lg">{cfg.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-500">{cfg.label}</p>
                        {r.table && <p className="text-xs text-gray-400">Table {r.table.tableNumber}</p>}
                      </div>
                      <span className="text-xs text-gray-400">{timeAgo(r.createdAt)}</span>
                      <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">Traité</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
