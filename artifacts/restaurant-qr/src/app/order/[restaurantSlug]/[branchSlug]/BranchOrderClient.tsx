"use client";

import { useState } from "react";
import { toast } from "sonner";

type Option = { id: string; name: string; extraPrice: number };
type OptionGroup = { id: string; name: string; selectionType: string; isRequired: boolean; options: Option[] };
type MenuItem = {
  id: string; name: string; description: string | null;
  translationsJson: string | null; price: number; imageUrl: string | null;
  stockTrackingEnabled: boolean; stockQuantity: number | null;
  optionGroups: OptionGroup[];
};
type Category = { id: string; name: string; translationsJson: string | null; menuItems: MenuItem[] };
type CartItem = { menuItemId: string; name: string; basePrice: number; optionsPrice: number; quantity: number; options: Array<{ optionId: string; groupId: string; name: string; extraPrice: number }> };

interface Props {
  restaurant: { id: string; name: string; logoUrl: string | null; currency: string; primaryColor: string | null };
  branch: { id: string; name: string; slug: string; address: string | null; phone: string | null };
  categories: Category[];
}

type OrderMode = "TAKEAWAY" | "DELIVERY";

function parseAr(json: string | null, field: "name" | "description") {
  if (!json) return null;
  try { return (JSON.parse(json) as Record<string, Record<string, string>>).ar?.[field] || null; } catch { return null; }
}

export default function BranchOrderClient({ restaurant, branch, categories }: Props) {
  const brand = restaurant.primaryColor || "#f97316";
  const [mode, setMode] = useState<OrderMode>("TAKEAWAY");
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [step, setStep] = useState<"menu" | "checkout" | "success">("menu");
  const [orderResult, setOrderResult] = useState<{ orderNumber: string } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [optionModal, setOptionModal] = useState<MenuItem | null>(null);
  const [optionSelections, setOptionSelections] = useState<Record<string, string[]>>({});

  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  const getName = (item: MenuItem) => parseAr(item.translationsJson, "name") || item.name;
  const getCatName = (cat: Category) => parseAr(cat.translationsJson, "name") || cat.name;

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + (i.basePrice + i.optionsPrice) * i.quantity, 0);

  const addSimple = (item: MenuItem) => {
    if (item.optionGroups.some((g) => g.isRequired)) { setOptionModal(item); setOptionSelections({}); return; }
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id && c.options.length === 0);
      if (existing) return prev.map((c) => c.menuItemId === item.id && c.options.length === 0 ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item.id, name: item.name, basePrice: item.price, optionsPrice: 0, quantity: 1, options: [] }];
    });
  };

  const addWithOptions = () => {
    if (!optionModal) return;
    const requiredGroups = optionModal.optionGroups.filter((g) => g.isRequired);
    for (const g of requiredGroups) {
      if (!optionSelections[g.id] || optionSelections[g.id].length === 0) {
        toast.error(`يرجى اختيار ${g.name}`); return;
      }
    }
    const selectedOpts: CartItem["options"] = [];
    let optionsPrice = 0;
    for (const [groupId, optIds] of Object.entries(optionSelections)) {
      const group = optionModal.optionGroups.find((g) => g.id === groupId)!;
      for (const optId of optIds) {
        const opt = group.options.find((o) => o.id === optId)!;
        selectedOpts.push({ optionId: opt.id, groupId, name: opt.name, extraPrice: opt.extraPrice });
        optionsPrice += opt.extraPrice;
      }
    }
    setCart((prev) => [...prev, { menuItemId: optionModal.id, name: optionModal.name, basePrice: optionModal.price, optionsPrice, quantity: 1, options: selectedOpts }]);
    setOptionModal(null); setOptionSelections({});
  };

  const toggleOption = (groupId: string, optId: string, selType: string) => {
    setOptionSelections((prev) => {
      const current = prev[groupId] || [];
      if (selType === "SINGLE") return { ...prev, [groupId]: [optId] };
      return { ...prev, [groupId]: current.includes(optId) ? current.filter((id) => id !== optId) : [...current, optId] };
    });
  };

  const placeOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim()) { toast.error(t("Name and phone required", "الاسم والهاتف مطلوبان")); return; }
    if (mode === "DELIVERY" && !deliveryAddress.trim()) { toast.error(t("Delivery address required", "العنوان مطلوب للتوصيل")); return; }
    setPlacing(true);

    const res = await fetch("/api/public/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: restaurant.id,
        branchId: branch.id,
        orderType: mode,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: mode === "DELIVERY" ? deliveryAddress.trim() : undefined,
        notes: notes.trim() || undefined,
        promoCode: promoCode.trim() || undefined,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          quantity: c.quantity,
          selectedOptions: c.options.map((o) => ({ optionId: o.optionId, groupId: o.groupId })),
        })),
      }),
    });
    const data = await res.json();
    setPlacing(false);
    if (!res.ok) { toast.error(data.error || t("Order failed", "فشل الطلب")); return; }
    setOrderResult(data);
    setStep("success");
  };

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50 p-6" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-sm w-full">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("Order Placed!", "تم الطلب!")}</h2>
          <p className="text-gray-500 mb-4">{t("Order number", "رقم الطلب")}: <span className="font-bold text-orange-500">#{orderResult?.orderNumber}</span></p>
          <p className="text-sm text-gray-400 mb-6">{mode === "DELIVERY" ? t("We'll deliver to your address soon.", "سيتم التوصيل قريباً.") : t("Your order will be ready for pickup.", "طلبك جاهز للاستلام قريباً.")}</p>
          <button onClick={() => { setCart([]); setStep("menu"); setOrderResult(null); setCustomerName(""); setCustomerPhone(""); setDeliveryAddress(""); setPromoCode(""); setNotes(""); }}
            className="w-full py-3 rounded-xl font-bold text-white transition" style={{ backgroundColor: brand }}>
            {t("New Order", "طلب جديد")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="text-white px-4 pt-10 pb-6" style={{ background: `linear-gradient(135deg, ${brand}, ${brand}cc)` }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {restaurant.logoUrl && <img src={restaurant.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />}
              <div>
                <p className="font-bold text-lg">{restaurant.name}</p>
                <p className="text-white/70 text-xs">{branch.name} {branch.address ? `· ${branch.address}` : ""}</p>
              </div>
            </div>
            <button onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="bg-white/20 px-2.5 py-1.5 rounded-lg text-xs font-bold">
              {lang === "en" ? "عر" : "EN"}
            </button>
          </div>
          {/* Mode switcher */}
          <div className="flex bg-white/20 rounded-xl p-1 gap-1">
            {(["TAKEAWAY", "DELIVERY"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${mode === m ? "bg-white text-gray-900" : "text-white"}`}>
                {m === "TAKEAWAY" ? t("🥡 Takeaway", "🥡 استلام") : t("🛵 Delivery", "🛵 توصيل")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-32">
        {step === "menu" ? (
          <>
            {categories.filter((c) => c.menuItems.length > 0).map((cat) => (
              <div key={cat.id} className="mt-5">
                <h2 className="text-base font-bold text-gray-700 mb-3 uppercase tracking-wide text-xs">{getCatName(cat)}</h2>
                <div className="space-y-2">
                  {cat.menuItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl p-4 flex gap-3 shadow-sm">
                      {item.imageUrl && <img src={item.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{getName(item)}</p>
                        {item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>}
                        <p className="text-sm font-bold mt-1" style={{ color: brand }}>{item.price.toFixed(2)} {restaurant.currency}</p>
                      </div>
                      <div className="shrink-0 flex items-center">
                        {item.stockTrackingEnabled && (item.stockQuantity ?? 0) <= 0 ? (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{t("Out", "نفد")}</span>
                        ) : (
                          <button onClick={() => addSimple(item)}
                            className="w-8 h-8 rounded-full text-white text-lg font-bold flex items-center justify-center transition"
                            style={{ backgroundColor: brand }}>+</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="mt-5 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">{t("Checkout", "إتمام الطلب")}</h2>
            {/* Cart summary */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">{t("Your Order", "طلبك")}</h3>
              {cart.map((c, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span>{c.quantity}× {c.name}{c.options.length > 0 ? ` (${c.options.map((o) => o.name).join(", ")})` : ""}</span>
                  <span className="font-medium">{((c.basePrice + c.optionsPrice) * c.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between font-bold">
                <span>{t("Total", "الإجمالي")}</span>
                <span>{subtotal.toFixed(2)} {restaurant.currency}</span>
              </div>
            </div>
            {/* Customer info */}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">{t("Your Info", "معلوماتك")}</h3>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder={t("Your name *", "اسمك *")} />
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder={t("Phone number *", "رقم الهاتف *")} type="tel" />
              {mode === "DELIVERY" && (
                <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  rows={2} placeholder={t("Delivery address *", "عنوان التوصيل *")} />
              )}
              <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder={t("Promo code (optional)", "كود خصم (اختياري)")} />
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                rows={2} placeholder={t("Notes (optional)", "ملاحظات (اختياري)")} />
            </div>
            <button onClick={placeOrder} disabled={placing}
              className="w-full py-4 rounded-2xl text-white font-bold text-base transition disabled:opacity-60"
              style={{ backgroundColor: brand }}>
              {placing ? t("Placing...", "جاري الطلب...") : t(`Place ${mode === "DELIVERY" ? "Delivery" : "Takeaway"} Order`, `تأكيد طلب ${mode === "DELIVERY" ? "التوصيل" : "الاستلام"}`)}
            </button>
          </div>
        )}
      </div>

      {/* Cart bar */}
      {totalItems > 0 && step === "menu" && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg">
          <div className="max-w-lg mx-auto">
            <button onClick={() => setStep("checkout")}
              className="w-full py-3.5 rounded-2xl text-white font-bold flex items-center justify-between px-5 transition"
              style={{ backgroundColor: brand }}>
              <span className="bg-white/30 px-2.5 py-0.5 rounded-full text-sm">{totalItems}</span>
              <span>{t("Continue to Checkout", "متابعة للدفع")}</span>
              <span>{subtotal.toFixed(2)} {restaurant.currency}</span>
            </button>
          </div>
        </div>
      )}
      {step === "checkout" && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
          <div className="max-w-lg mx-auto">
            <button onClick={() => setStep("menu")} className="text-sm text-gray-500 hover:text-gray-700">← {t("Back to menu", "العودة للقائمة")}</button>
          </div>
        </div>
      )}

      {/* Options modal */}
      {optionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold text-gray-900 text-lg mb-4">{getName(optionModal)}</h3>
            {optionModal.optionGroups.map((group) => (
              <div key={group.id} className="mb-4">
                <p className="font-semibold text-sm text-gray-700 mb-2">
                  {group.name} {group.isRequired && <span className="text-red-500 text-xs">*</span>}
                  <span className="text-gray-400 text-xs font-normal ms-1">({group.selectionType === "SINGLE" ? t("Choose one", "اختر واحد") : t("Multiple", "متعدد")})</span>
                </p>
                {group.options.map((opt) => {
                  const selected = (optionSelections[group.id] || []).includes(opt.id);
                  return (
                    <button key={opt.id} onClick={() => toggleOption(group.id, opt.id, group.selectionType)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 mb-1.5 transition ${selected ? "border-orange-400 bg-orange-50" : "border-gray-100 hover:border-gray-200"}`}>
                      <span className="text-sm font-medium">{opt.name}</span>
                      <span className="text-sm text-gray-500">{opt.extraPrice > 0 ? `+${opt.extraPrice.toFixed(2)}` : t("Free", "مجاناً")}</span>
                    </button>
                  );
                })}
              </div>
            ))}
            <div className="flex gap-3 mt-4">
              <button onClick={addWithOptions}
                className="flex-1 py-3 rounded-xl text-white font-bold transition" style={{ backgroundColor: brand }}>
                {t("Add to Cart", "أضف للسلة")}
              </button>
              <button onClick={() => { setOptionModal(null); setOptionSelections({}); }}
                className="px-5 py-3 bg-gray-100 rounded-xl text-gray-700 font-medium text-sm">
                {t("Cancel", "إلغاء")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
