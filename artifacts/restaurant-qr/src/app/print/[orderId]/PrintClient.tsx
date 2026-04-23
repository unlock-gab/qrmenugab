"use client";

import { formatDA } from "@/lib/i18n";

const METHOD_FR: Record<string, string> = {
  CASH: "Espèces", CARD: "Carte bancaire",
  TRANSFER: "Virement", OTHER: "Autre",
};
const ORDER_TYPE_FR: Record<string, string> = {
  DINE_IN: "Sur place", TAKEAWAY: "À emporter", DELIVERY: "Livraison",
};
const ORDER_TYPE_ICON: Record<string, string> = {
  DINE_IN: "🍽️", TAKEAWAY: "🥡", DELIVERY: "🛵",
};

interface OrderItemOption { id: string; nameSnapshot: string; extraPrice: number; }
interface OrderItem {
  id: string; nameSnapshot: string; quantity: number;
  unitPrice: number; totalPrice: number; orderItemOptions?: OrderItemOption[];
}
interface Order {
  id: string; orderNumber: string; status: string; paymentStatus: string;
  paymentMethod?: string | null; orderSource: string; orderType?: string | null;
  notes?: string | null; subtotal: number; total: number;
  discountAmount?: number; discountCode?: string | null; finalTotal?: number;
  createdAt: string; servedAt?: string | null; paidAt?: string | null;
  customerName?: string | null; customerPhone?: string | null;
  table: { tableNumber: string } | null;
  branch?: { name: string } | null;
  restaurant: { name: string; phone?: string | null; address?: string | null; currency: string };
  orderItems: OrderItem[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-DZ", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function PrintClient({ order }: { order: Order }) {
  const finalTotal = order.finalTotal ?? (order.total - (order.discountAmount ?? 0));
  const isPaid = order.paymentStatus === "PAID";

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Print controls — hidden when printing */}
      <div className="print:hidden flex gap-3 p-4 max-w-sm mx-auto">
        <button onClick={() => window.print()}
          className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-700 transition flex items-center justify-center gap-2">
          🖨️ Imprimer le reçu
        </button>
        <button onClick={() => window.close()}
          className="px-4 py-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition">
          ✕
        </button>
      </div>

      {/* Receipt — thermal-like layout */}
      <div className="max-w-sm mx-auto bg-white print:shadow-none shadow-lg">
        <div className="p-5 print:p-4 font-mono text-sm">

          {/* Header */}
          <div className="text-center mb-4 pb-3 border-b-2 border-dashed border-gray-300">
            <h1 className="text-lg font-black tracking-tight text-gray-900 uppercase">
              {order.restaurant.name}
            </h1>
            {order.branch && (
              <p className="text-xs text-gray-500 mt-0.5">📍 {order.branch.name}</p>
            )}
            {order.restaurant.address && (
              <p className="text-xs text-gray-500">{order.restaurant.address}</p>
            )}
            {order.restaurant.phone && (
              <p className="text-xs text-gray-500">Tél: {order.restaurant.phone}</p>
            )}
          </div>

          {/* Order meta */}
          <div className="space-y-1 mb-4 text-xs">
            <Row label="N° commande" value={`#${order.orderNumber}`} bold />
            {order.orderType && (
              <Row label="Type"
                value={`${ORDER_TYPE_ICON[order.orderType] || ""} ${ORDER_TYPE_FR[order.orderType] || order.orderType}`} />
            )}
            {order.table && <Row label="Table" value={order.table.tableNumber} />}
            {order.customerName && <Row label="Client" value={order.customerName} />}
            {order.customerPhone && <Row label="Tél client" value={order.customerPhone} />}
            <Row label="Date" value={formatDate(order.createdAt)} />
            {order.paidAt && <Row label="Payé le" value={formatDate(order.paidAt)} />}
            <Row label="Statut"
              value={isPaid ? "✅ Payé" : "⏳ Non réglé"}
              highlight={isPaid ? "green" : "amber"} />
          </div>

          {/* Items */}
          <div className="border-t-2 border-dashed border-gray-300 pt-3 mb-3">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Articles</p>
            <div className="space-y-1.5">
              {order.orderItems.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between text-xs">
                    <span className="flex-1 text-gray-800">
                      <span className="font-bold">{item.quantity}×</span> {item.nameSnapshot}
                    </span>
                    <span className="font-medium text-gray-900 ml-2 whitespace-nowrap">
                      {formatDA(item.totalPrice)}
                    </span>
                  </div>
                  {item.orderItemOptions && item.orderItemOptions.length > 0 && (
                    <div className="text-xs text-gray-400 ml-4">
                      {item.orderItemOptions.map((o) => `  + ${o.nameSnapshot}`).join("  ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t-2 border-dashed border-gray-300 pt-3 space-y-1 text-xs">
            <Row label="Sous-total" value={formatDA(order.subtotal)} />
            {(order.discountAmount ?? 0) > 0 && (
              <Row
                label={`Remise${order.discountCode ? ` (${order.discountCode})` : ""}`}
                value={`−${formatDA(order.discountAmount ?? 0)}`}
                highlight="green"
              />
            )}
            <div className="flex justify-between font-black text-base pt-1.5 border-t border-gray-300 text-gray-900">
              <span>TOTAL</span>
              <span>{formatDA(finalTotal)}</span>
            </div>
            {order.paymentMethod && (
              <Row label="Paiement" value={METHOD_FR[order.paymentMethod] ?? order.paymentMethod} />
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mt-3 pt-3 border-t border-dashed border-gray-300">
              <p className="text-xs text-gray-500 font-bold mb-1">Notes</p>
              <p className="text-xs text-gray-700 italic">{order.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-4 pt-3 border-t-2 border-dashed border-gray-300">
            <p className="text-xs font-bold text-gray-700">Merci pour votre visite !</p>
            <p className="text-xs text-gray-400 mt-0.5">QR Menu · Système de commande numérique</p>
            <p className="text-[10px] text-gray-300 mt-0.5">{order.id.slice(0, 12).toUpperCase()}</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          @page { margin: 4mm; size: 80mm auto; }
          * { font-family: 'Courier New', Courier, monospace !important; }
        }
      `}</style>
    </div>
  );
}

function Row({
  label, value, bold, highlight,
}: {
  label: string; value: string; bold?: boolean; highlight?: "green" | "amber" | "red";
}) {
  const valueClass = highlight === "green" ? "text-emerald-700 font-semibold"
    : highlight === "amber" ? "text-amber-700 font-semibold"
    : highlight === "red" ? "text-red-700 font-semibold"
    : bold ? "font-bold text-gray-900"
    : "text-gray-700";
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={`text-right ${valueClass}`}>{value}</span>
    </div>
  );
}
