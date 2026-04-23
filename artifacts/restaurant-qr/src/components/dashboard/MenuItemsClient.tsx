"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

type Category = { id: string; name: string };
type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  ingredientsText: string | null;
  translationsJson: string | null;
  price: { toNumber: () => number } | number | string;
  imageUrl: string | null;
  isAvailable: boolean;
  stockTrackingEnabled: boolean;
  stockQuantity: number | null;
  sortOrder: number;
  category: { id: string; name: string };
};

type Props = {
  initialItems: MenuItem[];
  categories: Category[];
};

const EMPTY_FORM = {
  categoryId: "",
  name: "",
  nameAr: "",
  description: "",
  descriptionAr: "",
  ingredientsText: "",
  price: "",
  imageUrl: "",
  stockTrackingEnabled: false,
  stockQuantity: "",
};

function getPrice(price: MenuItem["price"]) {
  if (typeof price === "object" && price !== null && "toNumber" in price) return price.toNumber();
  return Number(price);
}

function parseTranslations(json: string | null) {
  if (!json) return { nameAr: "", descriptionAr: "" };
  try {
    const obj = JSON.parse(json) as Record<string, Record<string, string>>;
    return { nameAr: obj.ar?.name || "", descriptionAr: obj.ar?.description || "" };
  } catch { return { nameAr: "", descriptionAr: "" }; }
}

function buildTranslations(nameAr: string, descriptionAr: string) {
  if (!nameAr && !descriptionAr) return undefined;
  return JSON.stringify({ ar: { name: nameAr, description: descriptionAr } });
}

function StockBadge({ item }: { item: MenuItem }) {
  if (!item.stockTrackingEnabled) return null;
  const qty = item.stockQuantity ?? 0;
  if (qty <= 0) return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">نفد المخزون</span>;
  if (qty <= 5) return <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">مخزون منخفض: {qty}</span>;
  return <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-medium">مخزون: {qty}</span>;
}

export function MenuItemsClient({ initialItems, categories }: Props) {
  const [items, setItems] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockInput, setStockInput] = useState("");

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId) return;
    setLoading(true);

    const translationsJson = buildTranslations(form.nameAr, form.descriptionAr);

    const payload = {
      categoryId: form.categoryId,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      ingredientsText: form.ingredientsText.trim() || undefined,
      translationsJson,
      price: parseFloat(form.price),
      imageUrl: form.imageUrl.trim() || undefined,
      stockTrackingEnabled: form.stockTrackingEnabled,
      stockQuantity: form.stockTrackingEnabled && form.stockQuantity ? parseInt(form.stockQuantity) : undefined,
    };

    const url = editId ? `/api/menu-items/${editId}` : "/api/menu-items";
    const method = editId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error || "Failed to save item");
    } else {
      if (editId) {
        setItems((prev) => prev.map((i) => (i.id === editId ? data : i)));
        toast.success("تم التحديث");
      } else {
        setItems((prev) => [...prev, data]);
        toast.success("تم الإضافة");
      }
      setShowForm(false); setEditId(null); setForm(EMPTY_FORM); setShowAdvanced(false);
    }
  }, [form, editId]);

  const toggleAvailable = useCallback(async (id: string, current: boolean) => {
    const res = await fetch(`/api/menu-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !current }),
    });
    const data = await res.json();
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === id ? data : i)));
    } else { toast.error("Failed to update"); }
  }, []);

  const updateStock = async (id: string) => {
    const qty = parseInt(stockInput);
    if (isNaN(qty) || qty < 0) return;
    const res = await fetch(`/api/menu-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQuantity: qty, isAvailable: qty > 0 }),
    });
    const data = await res.json();
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === id ? data : i)));
      toast.success("تم تحديث المخزون");
      setEditingStock(null);
    }
  };

  const deleteItem = useCallback(async (id: string) => {
    if (!confirm("حذف هذا العنصر؟")) return;
    const res = await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("تم الحذف");
    } else { toast.error("Failed to delete"); }
  }, []);

  const startEdit = (item: MenuItem) => {
    setEditId(item.id);
    const price = getPrice(item.price).toString();
    const { nameAr, descriptionAr } = parseTranslations(item.translationsJson);
    setForm({
      categoryId: item.category.id,
      name: item.name,
      nameAr,
      description: item.description || "",
      descriptionAr,
      ingredientsText: item.ingredientsText || "",
      price,
      imageUrl: item.imageUrl || "",
      stockTrackingEnabled: item.stockTrackingEnabled,
      stockQuantity: item.stockQuantity?.toString() || "",
    });
    setShowAdvanced(!!(nameAr || descriptionAr || item.ingredientsText || item.stockTrackingEnabled));
    setShowForm(true);
  };

  const lowStockItems = items.filter((i) => i.stockTrackingEnabled && (i.stockQuantity ?? 0) > 0 && (i.stockQuantity ?? 0) <= 5);
  const outOfStockItems = items.filter((i) => i.stockTrackingEnabled && (i.stockQuantity ?? 0) <= 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">عناصر القائمة</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-500 text-sm">{items.length} عنصر</p>
            {outOfStockItems.length > 0 && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{outOfStockItems.length} نفد</span>
            )}
            {lowStockItems.length > 0 && (
              <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">{lowStockItems.length} منخفض</span>
            )}
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); setShowAdvanced(false); }}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition"
        >
          + إضافة عنصر
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editId ? "تعديل العنصر" : "عنصر جديد"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم (English) *</label>
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Item name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف *</label>
                <select required value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                  <option value="">اختر تصنيفاً...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" rows={2} placeholder="Description" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السعر *</label>
                <input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="9.99" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رابط الصورة</label>
              <input type="url" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="https://..." />
            </div>

            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-orange-500 hover:text-orange-700 font-medium flex items-center gap-1">
              {showAdvanced ? "▲" : "▼"} خيارات متقدمة (ترجمة، مكونات، مخزون)
            </button>

            {showAdvanced && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الاسم بالعربية</label>
                    <input value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="اسم الصنف" dir="rtl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الوصف بالعربية</label>
                    <textarea value={form.descriptionAr} onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" rows={2} placeholder="وصف الصنف" dir="rtl" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المكوّنات / الحساسيات</label>
                  <input value={form.ingredientsText} onChange={(e) => setForm((f) => ({ ...f, ingredientsText: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="مثال: قمح، حليب، بيض" />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.stockTrackingEnabled} onChange={(e) => setForm((f) => ({ ...f, stockTrackingEnabled: e.target.checked }))}
                      className="rounded" />
                    <span className="text-sm font-medium text-gray-700">تتبع المخزون</span>
                  </label>
                  {form.stockTrackingEnabled && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">كمية المخزون</label>
                      <input type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="0" />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                {loading ? "جاري الحفظ..." : editId ? "تحديث" : "إضافة"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-gray-500 font-medium">لا توجد عناصر بعد</p>
          <p className="text-gray-400 text-sm mt-1">أضف تصنيفاً أولاً ثم أضف العناصر</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-4">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center text-2xl shrink-0">🍽️</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">{item.category.name}</span>
                  <StockBadge item={item} />
                </div>
                {item.description && <p className="text-xs text-gray-400 truncate mt-0.5">{item.description}</p>}
                <p className="text-sm font-bold text-orange-500 mt-0.5">{formatPrice(item.price)}</p>

                {/* Inline stock editor */}
                {item.stockTrackingEnabled && editingStock === item.id && (
                  <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                    <input type="number" min="0" value={stockInput} onChange={(e) => setStockInput(e.target.value)}
                      className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm" placeholder="0" />
                    <button onClick={() => updateStock(item.id)} className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-medium">حفظ</button>
                    <button onClick={() => setEditingStock(null)} className="px-2 py-1 text-gray-400 text-xs">✕</button>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => toggleAvailable(item.id, item.isAvailable)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${item.isAvailable ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                    {item.isAvailable ? "متاح" : "غير متاح"}
                  </button>
                  {item.stockTrackingEnabled && (
                    <button onClick={() => { setEditingStock(editingStock === item.id ? null : item.id); setStockInput(item.stockQuantity?.toString() || "0"); }}
                      className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition">
                      📦 مخزون
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <a href={`/menu-items/${item.id}/options`}
                    className="text-xs px-2 py-1 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition">
                    خيارات ✦
                  </a>
                  <button onClick={() => startEdit(item)} className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition">تعديل</button>
                  <button onClick={() => deleteItem(item.id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition">حذف</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
