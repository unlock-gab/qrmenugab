"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDA } from "@/lib/i18n";

interface Table { id: string; tableNumber: string; }
interface Category { id: string; name: string; }
interface MenuItem { id: string; name: string; price: number; categoryId: string; description?: string | null; }

interface CartItem { menuItemId: string; name: string; price: number; quantity: number; }

export default function NewManualOrderPage() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/tables").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/menu-items").then((r) => r.json()),
    ]).then(([t, c, m]) => {
      setTables(t.tables ?? t);
      setCategories(c.categories ?? c);
      setMenuItems(m.menuItems ?? m);
    }).finally(() => setLoading(false));
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) return prev.map((c) => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === menuItemId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((c) => c.menuItemId !== menuItemId);
      return prev.map((c) => c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const filteredItems = selectedCategory === "all" ? menuItems : menuItems.filter((m) => m.categoryId === selectedCategory);
  const getQty = (id: string) => cart.find((c) => c.menuItemId === id)?.quantity ?? 0;

  const handleSubmit = async () => {
    if (!selectedTable) { setError("اختر طاولة أولاً"); return; }
    if (cart.length === 0) { setError("أضف صنفاً واحداً على الأقل"); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: selectedTable,
          notes: notes || undefined,
          items: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "فشل إنشاء الطلب"); return; }
      router.push("/waiter");
    } catch { setError("حدث خطأ، حاول مجدداً"); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">جاري التحميل...</div>;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 transition-colors">
          ← رجوع
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">طلب يدوي جديد</h1>
          <p className="text-sm text-gray-500">أنشئ طلباً دون مسح QR</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Menu */}
        <div className="lg:col-span-2 space-y-4">
          {/* Table Selector */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-2">الطاولة *</label>
            <div className="flex flex-wrap gap-2">
              {tables.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTable(t.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${selectedTable === t.id ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  طاولة {t.tableNumber}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === "all" ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"}`}
            >
              الكل
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === c.id ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"}`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredItems.map((item) => {
              const qty = getQty(item.id);
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                    {item.description && <p className="text-xs text-gray-400 line-clamp-1">{item.description}</p>}
                    <p className="text-base font-bold text-indigo-600 mt-1">{formatDA(Number(item.price))}</p>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    {qty > 0 ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center">−</button>
                        <span className="font-black text-gray-900 w-4 text-center">{qty}</span>
                        <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center">+</button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item)} className="w-full py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-semibold transition-colors">
                        + أضف
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-4">
            <h2 className="font-bold text-gray-900 mb-3">ملخص الطلب</h2>
            {cart.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">أضف أصنافاً من القائمة</p>
            ) : (
              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{item.quantity}× {item.name}</span>
                    <span className="font-medium text-gray-900">{formatDA(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                  <span>الإجمالي</span>
                  <span>{formatDA(total)}</span>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1">ملاحظات (اختياري)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات للمطبخ..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting || cart.length === 0 || !selectedTable}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "جاري الإرسال..." : "إرسال الطلب للمطبخ 🍳"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
