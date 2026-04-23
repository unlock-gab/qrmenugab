"use client";

const METHOD_AR: Record<string, string> = {
  CASH: "نقداً",
  CARD: "بطاقة بنكية",
  TRANSFER: "تحويل بنكي",
  OTHER: "أخرى",
};

const STATUS_AR: Record<string, string> = {
  NEW: "جديد",
  PREPARING: "يُحضَّر",
  READY: "جاهز",
  SERVED: "قُدِّم",
  PAID: "مدفوع",
  CANCELLED: "ملغي",
};

interface OrderItemOption {
  id: string;
  nameSnapshot: string;
  extraPrice: number;
}
interface OrderItem {
  id: string;
  nameSnapshot: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  orderItemOptions?: OrderItemOption[];
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  orderSource: string;
  notes?: string | null;
  subtotal: number;
  total: number;
  discountAmount?: number;
  discountCode?: string | null;
  finalTotal?: number;
  createdAt: string;
  servedAt?: string | null;
  paidAt?: string | null;
  table: { tableNumber: string };
  restaurant: { name: string; phone?: string | null; address?: string | null; currency: string };
  orderItems: OrderItem[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ar-SA", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function PrintClient({ order }: { order: Order }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-sm mx-auto p-6 print:p-4">
        {/* Print button — hidden in print */}
        <div className="print:hidden flex gap-2 mb-6">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors"
          >
            🖨️ طباعة الإيصال
          </button>
          <button
            onClick={() => window.close()}
            className="px-4 py-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Receipt */}
        <div className="border-2 border-gray-200 rounded-2xl p-6 print:border-0 print:rounded-none font-mono">
          {/* Header */}
          <div className="text-center mb-5 border-b border-dashed border-gray-300 pb-4">
            <h1 className="text-xl font-black text-gray-900">{order.restaurant.name}</h1>
            {order.restaurant.address && (
              <p className="text-xs text-gray-500 mt-1">{order.restaurant.address}</p>
            )}
            {order.restaurant.phone && (
              <p className="text-xs text-gray-500">{order.restaurant.phone}</p>
            )}
          </div>

          {/* Order Info */}
          <div className="space-y-1.5 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-500">رقم الطلب</span>
              <span className="font-bold text-gray-900">#{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">الطاولة</span>
              <span className="font-bold text-gray-900">{order.table.tableNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">التاريخ</span>
              <span className="text-gray-700 text-xs">{formatDate(order.createdAt)}</span>
            </div>
            {order.paidAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">وقت الدفع</span>
                <span className="text-gray-700 text-xs">{formatDate(order.paidAt)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">الحالة</span>
              <span className={`font-semibold ${order.paymentStatus === "PAID" ? "text-emerald-600" : "text-amber-600"}`}>
                {order.paymentStatus === "PAID" ? "✓ مدفوع" : "غير مسدَّد"}
              </span>
            </div>
            {order.orderSource === "MANUAL" && (
              <div className="flex justify-between">
                <span className="text-gray-500">المصدر</span>
                <span className="text-blue-600 text-xs">طلب يدوي</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border-t border-dashed border-gray-300 pt-4 mb-4">
            <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">الأصناف</p>
            <div className="space-y-2">
              {order.orderItems.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="text-gray-500">{item.quantity}×</span>{" "}
                      <span className="text-gray-900">{item.nameSnapshot}</span>
                    </div>
                    <span className="font-medium text-gray-900">{item.totalPrice.toFixed(2)}</span>
                  </div>
                  {item.orderItemOptions && item.orderItemOptions.length > 0 && (
                    <div className="text-xs text-gray-400 mr-4 mt-0.5">
                      {item.orderItemOptions.map((o) => `• ${o.nameSnapshot}`).join("  ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-dashed border-gray-300 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">المجموع الفرعي</span>
              <span>{order.subtotal.toFixed(2)}</span>
            </div>
            {(order.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between text-sm text-emerald-700 font-medium">
                <span>خصم {order.discountCode ? `(${order.discountCode})` : ""}</span>
                <span>−{(order.discountAmount ?? 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-gray-900 pt-1 border-t border-gray-200">
              <span>الإجمالي</span>
              <span>{(order.finalTotal ?? order.total).toFixed(2)} {order.restaurant.currency}</span>
            </div>
            {order.paymentMethod && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">طريقة الدفع</span>
                <span className="font-medium">{METHOD_AR[order.paymentMethod] ?? order.paymentMethod}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mt-4 pt-3 border-t border-dashed border-gray-300">
              <p className="text-xs text-gray-500 mb-1">ملاحظات</p>
              <p className="text-sm text-gray-700">{order.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-5 pt-4 border-t border-dashed border-gray-300">
            <p className="text-xs text-gray-400">شكراً لزيارتكم</p>
            <p className="text-xs text-gray-300 mt-1">Powered by QR Menu SaaS</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          @page { margin: 0.5cm; size: 80mm auto; }
        }
      `}</style>
    </div>
  );
}
