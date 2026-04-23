"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatDA } from "@/lib/i18n";
import { getBranchId } from "@/components/dashboard/BranchSwitcher";

interface OrderItem { id: string; nameSnapshot: string; quantity: number; unitPrice: number; }
interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  orderType?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  total: number;
  discountAmount?: number;
  discountCode?: string | null;
  createdAt: string;
  notes?: string | null;
  table: { tableNumber: string } | null;
  orderItems: OrderItem[];
}

const ORDER_TYPE_LABEL: Record<string, string> = {
  DINE_IN: "🍽️ Sur place",
  TAKEAWAY: "🥡 À emporter",
  DELIVERY: "🛵 Livraison",
};
const METHOD_LABELS: Record<string, string> = {
  CASH: "Espèces 💵",
  CARD: "Carte 💳",
  TRANSFER: "Virement 📲",
  OTHER: "Autre",
};
const STATUS_FR: Record<string, string> = {
  NEW: "Nouveau", PREPARING: "En cours", READY: "Prêt",
  SERVED: "Servi", PAID: "Payé",
};

function PayDialog({ order, onPay, onClose, paying }: { order: Order; onPay: (method: string) => void; onClose: () => void; paying: boolean }) {
  const [method, setMethod] = useState("CASH");
  const finalTotal = Math.max(0, Number(order.total) - Number(order.discountAmount ?? 0));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Confirmer le paiement</h2>
        <p className="text-sm text-gray-500 mb-4">
          {order.table ? `Table ${order.table.tableNumber}` : order.customerName || "—"}
          {order.orderType ? ` · ${ORDER_TYPE_LABEL[order.orderType] || order.orderType}` : ""}
          {" — Commande #"}{order.orderNumber}
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          {order.orderItems.map((i) => (
            <div key={i.id} className="flex justify-between text-sm py-1">
              <span>{i.quantity}× {i.nameSnapshot}</span>
              <span className="font-medium">{formatDA(i.unitPrice * i.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 mt-2 pt-2 space-y-1">
            {(order.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-medium">
                <span>Remise {order.discountCode ? `(${order.discountCode})` : ""}</span>
                <span>−{formatDA(Number(order.discountAmount))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900">
              <span>Montant dû</span>
              <span>{formatDA(finalTotal)}</span>
            </div>
          </div>
        </div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Mode de paiement</p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {(["CASH", "CARD", "TRANSFER", "OTHER"] as const).map((m) => (
            <button key={m} onClick={() => setMethod(m)}
              className={`py-3 rounded-xl font-semibold text-sm transition-colors ${method === m ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              {METHOD_LABELS[m]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">Annuler</button>
          <button onClick={() => onPay(method)} disabled={paying}
            className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {paying ? "…" : "Confirmer ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, onPay, priority }: { order: Order; onPay: () => void; priority?: boolean }) {
  const ago = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const finalTotal = Math.max(0, Number(order.total) - Number(order.discountAmount ?? 0));

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm p-4 ${priority ? "border-emerald-300" : "border-gray-100"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-lg font-black text-gray-900">#{order.orderNumber}</span>
            <span className="text-sm font-semibold text-gray-500">
              {order.table ? `Table ${order.table.tableNumber}` : order.customerName || "—"}
            </span>
            {order.orderType && ORDER_TYPE_LABEL[order.orderType] && (
              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {ORDER_TYPE_LABEL[order.orderType]}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priority ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {STATUS_FR[order.status] || order.status}
            </span>
            <span className="text-xs text-gray-400">{ago < 1 ? "À l'instant" : `${ago} min`}</span>
          </div>
          {order.customerPhone && (
            <p className="text-xs text-gray-400 mb-1">📞 {order.customerPhone}</p>
          )}
          <div className="text-sm text-gray-600 space-y-0.5">
            {order.orderItems.map((i) => (
              <div key={i.id}>{i.quantity}× {i.nameSnapshot}</div>
            ))}
          </div>
          {order.notes && <p className="text-xs text-amber-600 mt-1">📝 {order.notes}</p>}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-xl font-black text-gray-900">{formatDA(finalTotal)}</span>
          <div className="flex gap-1.5">
            <Link href={`/print/${order.id}`} target="_blank"
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold transition-colors">
              🖨️ Imprimer
            </Link>
            <button onClick={onPay}
              className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold transition-colors ${priority ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-500 hover:bg-indigo-600"}`}>
              Payer ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CashierPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [paying, setPaying] = useState(false);
  const [branchId, setBranchIdState] = useState<string | null>(null);

  useEffect(() => {
    setBranchIdState(getBranchId());
    const handler = () => setBranchIdState(getBranchId());
    window.addEventListener("branchChanged", handler);
    return () => window.removeEventListener("branchChanged", handler);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (branchId) params.set("branchId", branchId);
      const res = await fetch(`/api/cashier?${params}`, { cache: "no-store" });
      if (res.ok) setOrders(await res.json());
    } finally { setLoading(false); }
  }, [branchId]);

  useEffect(() => {
    fetchOrders();
    const i = setInterval(fetchOrders, 10000);
    return () => clearInterval(i);
  }, [fetchOrders]);

  const handlePay = async (method: string) => {
    if (!selected) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/orders/${selected.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: method }),
      });
      if (res.ok) {
        const paid = await res.json();
        setSelected(null);
        fetchOrders();
        window.open(`/print/${paid.id}`, "_blank");
      }
    } finally { setPaying(false); }
  };

  const served = orders.filter((o) => o.status === "SERVED");
  const other = orders.filter((o) => o.status !== "SERVED");
  const getFinalTotal = (o: Order) => Math.max(0, Number(o.total) - Number(o.discountAmount ?? 0));
  const totalUnpaid = orders.reduce((s, o) => s + getFinalTotal(o), 0);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {selected && <PayDialog order={selected} onPay={handlePay} onClose={() => setSelected(null)} paying={paying} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 Caisse</h1>
          <p className="text-sm text-gray-500 mt-0.5">Encaissements et facturation</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-gray-900">{formatDA(totalUnpaid)}</div>
          <div className="text-xs text-gray-400">Total impayé</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-amber-600">{orders.length}</div>
          <div className="text-xs text-amber-500 font-medium mt-1">Commandes impayées</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-emerald-600">{served.length}</div>
          <div className="text-xs text-emerald-500 font-medium mt-1">Servies (prêtes)</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-blue-600">{other.length}</div>
          <div className="text-xs text-blue-500 font-medium mt-1">En préparation</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Chargement…</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">✅</div>
          <p className="font-medium">Toutes les commandes sont réglées</p>
        </div>
      ) : (
        <div className="space-y-3">
          {served.length > 0 && (
            <h2 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Prêtes à encaisser</h2>
          )}
          {served.map((order) => (
            <OrderCard key={order.id} order={order} onPay={() => setSelected(order)} priority />
          ))}
          {other.length > 0 && served.length > 0 && (
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mt-4">En préparation</h2>
          )}
          {other.map((order) => (
            <OrderCard key={order.id} order={order} onPay={() => setSelected(order)} />
          ))}
        </div>
      )}
    </div>
  );
}
