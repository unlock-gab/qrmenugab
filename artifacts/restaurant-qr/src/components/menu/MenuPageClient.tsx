"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { formatDA } from "@/lib/i18n";

type OptionItem = { id: string; name: string; extraPrice: number };
type OptionGroup = {
  id: string;
  name: string;
  selectionType: "SINGLE" | "MULTIPLE";
  isRequired: boolean;
  options: OptionItem[];
};
type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  ingredientsText: string | null;
  translationsJson: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isOutOfStock: boolean;
  optionGroups: OptionGroup[];
};
type Category = {
  id: string;
  name: string;
  translationsJson: string | null;
  menuItems: MenuItem[];
};
type SelectedOption = { optionId: string; name: string; extraPrice: number; groupId: string };
type CartItem = {
  cartKey: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  optionsPrice: number;
  quantity: number;
  imageUrl: string | null;
  selectedOptions: SelectedOption[];
};
type Props = {
  restaurant: { id: string; name: string; logoUrl: string | null; currency?: string; primaryColor?: string | null };
  table: { id: string; tableNumber: string };
  categories: Category[];
};

function parseTranslations(json: string | null, lang: string, field: "name" | "description") {
  if (!json || lang === "en") return null;
  try {
    const obj = JSON.parse(json) as Record<string, Record<string, string>>;
    return obj[lang]?.[field] || null;
  } catch { return null; }
}

function getCartKey(menuItemId: string, selectedOptions: SelectedOption[]) {
  const optIds = selectedOptions.map((o) => o.optionId).sort().join(",");
  return `${menuItemId}:${optIds}`;
}

export function MenuPageClient({ restaurant, table, categories }: Props) {
  const brand = restaurant.primaryColor || "#f97316";
  const currency = restaurant.currency || "USD";
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [notes, setNotes] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<{ orderNumber: string; finalTotal: number } | null>(null);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || "");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemSelections, setItemSelections] = useState<SelectedOption[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<{ discountAmount: number; discountType: string; discountValue: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [showWaiterModal, setShowWaiterModal] = useState(false);
  const [waiterRequestType, setWaiterRequestType] = useState<"CALL_WAITER" | "REQUEST_BILL" | "HELP">("CALL_WAITER");
  const [sendingRequest, setSendingRequest] = useState(false);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id.replace("cat-", ""));
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    Object.values(categoryRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToCategory = (catId: string) => {
    categoryRefs.current[catId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById(`nav-${catId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  const openItem = (item: MenuItem) => {
    if (!item.isAvailable || item.isOutOfStock) return;
    if (item.optionGroups.length === 0) {
      addSimpleItem(item);
    } else {
      setSelectedItem(item);
      setItemSelections([]);
    }
  };

  const addSimpleItem = (item: MenuItem) => {
    const cartKey = getCartKey(item.id, []);
    setCart((prev) => {
      const existing = prev.find((i) => i.cartKey === cartKey);
      if (existing) return prev.map((i) => i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { cartKey, menuItemId: item.id, name: item.name, basePrice: item.price, optionsPrice: 0, quantity: 1, imageUrl: item.imageUrl, selectedOptions: [] }];
    });
  };

  const handleOptionToggle = (group: OptionGroup, option: OptionItem) => {
    setItemSelections((prev) => {
      if (group.selectionType === "SINGLE") {
        const without = prev.filter((s) => s.groupId !== group.id);
        return [...without, { optionId: option.id, name: option.name, extraPrice: option.extraPrice, groupId: group.id }];
      } else {
        const exists = prev.find((s) => s.optionId === option.id);
        if (exists) return prev.filter((s) => s.optionId !== option.id);
        return [...prev, { optionId: option.id, name: option.name, extraPrice: option.extraPrice, groupId: group.id }];
      }
    });
  };

  const isOptionSelected = (optionId: string) => itemSelections.some((s) => s.optionId === optionId);

  const addToCartWithOptions = () => {
    if (!selectedItem) return;
    for (const group of selectedItem.optionGroups) {
      if (group.isRequired && !itemSelections.some((s) => s.groupId === group.id)) {
        toast.error(`Please select: ${group.name}`);
        return;
      }
    }
    const optionsPrice = itemSelections.reduce((s, o) => s + o.extraPrice, 0);
    const cartKey = getCartKey(selectedItem.id, itemSelections);
    setCart((prev) => {
      const existing = prev.find((i) => i.cartKey === cartKey);
      if (existing) return prev.map((i) => i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { cartKey, menuItemId: selectedItem.id, name: selectedItem.name, basePrice: selectedItem.price, optionsPrice, quantity: 1, imageUrl: selectedItem.imageUrl, selectedOptions: itemSelections }];
    });
    setSelectedItem(null);
    setItemSelections([]);
  };

  const removeCartItem = (cartKey: string) => {
    setCart((prev) => {
      const item = prev.find((i) => i.cartKey === cartKey);
      if (!item) return prev;
      if (item.quantity === 1) return prev.filter((i) => i.cartKey !== cartKey);
      return prev.map((i) => i.cartKey === cartKey ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };
  const addCartItem = (cartKey: string) => {
    setCart((prev) => prev.map((i) => i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i));
  };

  const getItemQty = (id: string) => cart.filter((i) => i.menuItemId === id).reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + (i.basePrice + i.optionsPrice) * i.quantity, 0);
  const discount = promoResult?.discountAmount ?? 0;
  const finalTotal = Math.max(0, subtotal - discount);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true); setPromoError(""); setPromoResult(null);
    const res = await fetch("/api/promo-codes/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: promoCode.trim(), restaurantId: restaurant.id, orderTotal: subtotal }),
    });
    const data = await res.json();
    setPromoLoading(false);
    if (!res.ok) { setPromoError(data.error || "Invalid promo code"); }
    else { setPromoResult({ discountAmount: data.discountAmount, discountType: data.discountType, discountValue: data.discountValue }); }
  };

  const removePromo = () => { setPromoResult(null); setPromoCode(""); setPromoError(""); };

  const placeOrder = useCallback(async () => {
    if (cart.length === 0) return;
    setOrdering(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: restaurant.id,
        tableId: table.id,
        notes: notes.trim() || undefined,
        promoCode: promoResult ? promoCode.trim() : undefined,
        items: cart.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          selectedOptions: i.selectedOptions.map((o) => ({ optionId: o.optionId, name: o.name, extraPrice: o.extraPrice })),
        })),
      }),
    });
    const data = await res.json();
    setOrdering(false);
    if (!res.ok) {
      toast.error(data.error || "Failed to place order. Please try again.");
    } else {
      setOrderPlaced({ orderNumber: data.orderNumber, finalTotal: data.finalTotal ?? finalTotal });
      setCart([]); setNotes(""); setShowCart(false); setPromoResult(null); setPromoCode("");
    }
  }, [cart, restaurant.id, table.id, notes, promoCode, promoResult, finalTotal]);

  const sendWaiterRequest = async () => {
    setSendingRequest(true);
    const res = await fetch("/api/waiter-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId: restaurant.id, tableId: table.id, type: waiterRequestType }),
    });
    setSendingRequest(false);
    if (res.ok) {
      setShowWaiterModal(false);
      toast.success(lang === "ar" ? "تم إرسال الطلب" : "Request sent!");
    } else {
      toast.error("Failed to send request.");
    }
  };

  const getCatName = (cat: Category) => parseTranslations(cat.translationsJson, lang, "name") || cat.name;
  const getItemName = (item: MenuItem) => parseTranslations(item.translationsJson, lang, "name") || item.name;
  const getItemDesc = (item: MenuItem) => parseTranslations(item.translationsJson, lang, "description") || item.description;

  const t = (en: string, ar: string) => lang === "ar" ? ar : en;

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-6" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="text-center max-w-sm w-full">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
            <span className="text-4xl">✓</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">{t("Order Placed!", "تم استلام طلبك!")}</h2>
          <p className="text-gray-500 text-sm mb-1">{t("Order", "رقم الطلب")} <strong className="text-gray-800">{orderPlaced.orderNumber}</strong></p>
          <p className="text-gray-500 text-sm mb-6">
            {t(`Your order has been sent to the kitchen and will be brought to Table ${table.tableNumber}.`, `طلبك في المطبخ وسيُقدَّم لك على الطاولة ${table.tableNumber}.`)}
          </p>
          {orderPlaced.finalTotal > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-6 text-sm text-orange-700 font-semibold">
              {t("Total", "الإجمالي")}: {formatDA(orderPlaced.finalTotal)}
            </div>
          )}
          <button
            onClick={() => setOrderPlaced(null)}
            style={{ background: brand }}
            className="w-full text-white py-4 rounded-2xl font-bold text-sm hover:opacity-90 transition active:scale-95"
          >
            {t("Order More", "اطلب المزيد")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${brand}, ${brand}cc)` }}>
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          {restaurant.logoUrl
            ? <img src={restaurant.logoUrl} alt={restaurant.name} className="w-11 h-11 rounded-xl object-cover bg-white/20 shrink-0" />
            : <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center text-xl shrink-0">🍽️</div>
          }
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-white leading-tight truncate">{restaurant.name}</h1>
            <p className="text-white/75 text-xs">{t("Table", "طاولة")} {table.tableNumber}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
            >
              {lang === "en" ? "عر" : "EN"}
            </button>
            <button
              onClick={() => setShowWaiterModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
            >
              🔔 <span>{t("Waiter", "استدعاء النادل")}</span>
            </button>
            {itemCount > 0 && (
              <button
                onClick={() => setShowCart(true)}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-sm font-bold transition flex items-center gap-1"
              >
                🛒 {itemCount}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category nav */}
      {categories.length > 1 && (
        <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
          <div className="max-w-lg mx-auto px-4 flex gap-1 overflow-x-auto py-2.5 scrollbar-none">
            {categories.map((cat) => (
              <button
                id={`nav-${cat.id}`}
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                style={activeCategory === cat.id ? { background: brand, color: "white" } : {}}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition shrink-0 ${activeCategory === cat.id ? "" : "bg-gray-100 text-gray-600 hover:bg-orange-50"}`}
              >
                {getCatName(cat)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu items */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-8 pb-36">
        {categories.map((cat) => (
          <div key={cat.id} id={`cat-${cat.id}`} ref={(el) => { categoryRefs.current[cat.id] = el; }}>
            <h2 className="text-base font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">{getCatName(cat)}</h2>
            <div className="space-y-3">
              {cat.menuItems.map((item) => {
                const unavailable = !item.isAvailable || item.isOutOfStock;
                const qty = getItemQty(item.id);
                const itemName = getItemName(item);
                const itemDesc = getItemDesc(item);
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition ${unavailable ? "opacity-60 border-gray-100" : "border-gray-100 hover:shadow-md cursor-pointer"}`}
                    onClick={() => !unavailable && openItem(item)}
                  >
                    <div className="flex items-start gap-3 p-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={itemName}
                          className={`w-20 h-20 rounded-xl object-cover shrink-0 ${unavailable ? "grayscale" : ""}`}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <h3 className="font-bold text-gray-900 text-sm leading-tight flex-1">{itemName}</h3>
                          {item.isOutOfStock && (
                            <span className="shrink-0 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">{t("Sold out", "نفذ")}</span>
                          )}
                          {!item.isAvailable && !item.isOutOfStock && (
                            <span className="shrink-0 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">{t("Unavailable", "غير متاح")}</span>
                          )}
                        </div>
                        {itemDesc && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{itemDesc}</p>}
                        {item.ingredientsText && (
                          <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">
                            <span className="font-medium">{t("Contains:", "يحتوي:")}</span> {item.ingredientsText}
                          </p>
                        )}
                        {item.optionGroups.length > 0 && (
                          <p className="text-xs text-orange-500 mt-0.5">{t("Customizable", "قابل للتخصيص")} ✦</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-gray-900">
                            {formatDA(item.price)}
                          </span>
                          {!unavailable && (
                            qty > 0 ? (
                              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-2 py-1" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => { const k = cart.find((c) => c.menuItemId === item.id)?.cartKey; if (k) removeCartItem(k); }} className="w-5 h-5 flex items-center justify-center text-gray-600 font-bold hover:text-orange-600">−</button>
                                <span className="text-sm font-bold text-gray-800 w-4 text-center">{qty}</span>
                                <button onClick={(e) => { e.stopPropagation(); openItem(item); }} className="w-5 h-5 flex items-center justify-center font-bold hover:text-orange-600" style={{ color: brand }}>+</button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); openItem(item); }}
                                style={{ background: brand }}
                                className="w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-lg leading-none hover:opacity-90 transition"
                              >
                                +
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating cart button */}
      {itemCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-30">
          <button
            onClick={() => setShowCart(true)}
            style={{ background: brand }}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl text-white font-bold shadow-xl hover:opacity-90 transition active:scale-95 max-w-sm w-full"
          >
            <span className="bg-white/20 rounded-xl px-2 py-0.5 text-sm">{itemCount}</span>
            <span className="flex-1 text-center">{t("View Cart", "عرض السلة")}</span>
            <span className="text-sm opacity-90">{formatDA(finalTotal)}</span>
          </button>
        </div>
      )}

      {/* Item options modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">{getItemName(selectedItem)}</h3>
              <button onClick={() => { setSelectedItem(null); setItemSelections([]); }} className="text-gray-400 hover:text-gray-700 text-xl w-8 h-8 flex items-center justify-center">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {selectedItem.optionGroups.map((group) => (
                <div key={group.id}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 text-sm">{group.name}</h4>
                    <div className="flex items-center gap-2">
                      {group.isRequired && <span className="text-xs text-red-500 font-medium">{t("Required", "مطلوب")}</span>}
                      <span className="text-xs text-gray-400">{group.selectionType === "SINGLE" ? t("Choose 1", "اختر واحداً") : t("Multiple", "متعدد")}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {group.options.map((opt) => (
                      <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${isOptionSelected(opt.id) ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <input
                          type={group.selectionType === "SINGLE" ? "radio" : "checkbox"}
                          name={`group-${group.id}`}
                          checked={isOptionSelected(opt.id)}
                          onChange={() => handleOptionToggle(group, opt)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-${group.selectionType === "SINGLE" ? "full" : "sm"} border-2 flex items-center justify-center shrink-0 transition ${isOptionSelected(opt.id) ? "border-orange-500 bg-orange-500" : "border-gray-300"}`}>
                          {isOptionSelected(opt.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className="flex-1 text-sm text-gray-800">{opt.name}</span>
                        {opt.extraPrice > 0 && <span className="text-sm text-gray-500 font-medium">+{formatDA(opt.extraPrice)}</span>}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">{t("Item total", "المجموع")}</span>
                <span className="font-bold text-gray-900">
                  {formatDA(selectedItem.price + itemSelections.reduce((s, o) => s + o.extraPrice, 0))}
                </span>
              </div>
              <button
                onClick={addToCartWithOptions}
                style={{ background: brand }}
                className="w-full text-white py-3.5 rounded-2xl font-bold hover:opacity-90 transition active:scale-95"
              >
                {t("Add to Cart", "أضف للسلة")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart sheet */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowCart(false)}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">{t("Your Order", "طلبك")} · {t("Table", "طاولة")} {table.tableNumber}</h3>
              <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-700 text-xl w-8 h-8 flex items-center justify-center">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              <div className="space-y-3 mb-5">
                {cart.map((item) => (
                  <div key={item.cartKey} className="flex items-start gap-3">
                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                      {item.selectedOptions.length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.selectedOptions.map((o) => o.name).join(", ")}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">{formatDA((item.basePrice + item.optionsPrice) * item.quantity)}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-2 py-1">
                      <button onClick={() => removeCartItem(item.cartKey)} className="w-5 h-5 flex items-center justify-center text-gray-500 font-bold hover:text-red-500">−</button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => addCartItem(item.cartKey)} className="w-5 h-5 flex items-center justify-center font-bold hover:text-orange-600" style={{ color: brand }}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("Any notes for the kitchen? (allergies, preferences…)", "ملاحظات للمطبخ؟ (حساسية، تفضيلات...)")}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none h-16 mb-4 focus:outline-none focus:border-orange-300"
              />

              <div className="mb-4">
                {!promoResult ? (
                  <div className="flex gap-2">
                    <input
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                      placeholder={t("Promo code", "كود الخصم")}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-orange-300"
                    />
                    <button
                      onClick={validatePromo}
                      disabled={promoLoading || !promoCode.trim()}
                      className="px-4 py-2 bg-gray-900 text-white text-sm rounded-xl font-medium hover:bg-gray-700 disabled:opacity-40 transition"
                    >
                      {promoLoading ? "..." : t("Apply", "تطبيق")}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                    <span className="text-green-700 text-sm font-medium flex-1">
                      ✓ {promoCode} — −{formatDA(promoResult.discountAmount)}
                    </span>
                    <button onClick={removePromo} className="text-green-500 hover:text-green-700 text-sm">✕</button>
                  </div>
                )}
                {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{t("Subtotal", "المجموع الجزئي")}</span>
                  <span>{formatDA(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>{t("Discount", "الخصم")}</span>
                    <span>−{formatDA(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900">
                  <span>{t("Total", "الإجمالي")}</span>
                  <span>{formatDA(finalTotal)}</span>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100">
              <button
                onClick={placeOrder}
                disabled={ordering || cart.length === 0}
                style={{ background: brand }}
                className="w-full text-white py-4 rounded-2xl font-bold text-base hover:opacity-90 transition active:scale-95 disabled:opacity-50"
              >
                {ordering ? (t("Sending…", "جاري الإرسال...")) : t("Place Order", "تأكيد الطلب")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call waiter modal */}
      {showWaiterModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">{t("Call Waiter", "استدعاء النادل")}</h3>
              <button onClick={() => setShowWaiterModal(false)} className="text-gray-400 hover:text-gray-700 text-xl w-8 h-8 flex items-center justify-center">✕</button>
            </div>
            <div className="space-y-2 mb-6">
              {([
                { type: "CALL_WAITER" as const, icon: "🙋", en: "Call Waiter", ar: "استدعاء النادل" },
                { type: "REQUEST_BILL" as const, icon: "🧾", en: "Request Bill", ar: "طلب الحساب" },
                { type: "HELP" as const, icon: "❓", en: "Need Help", ar: "أحتاج مساعدة" },
              ] as { type: "CALL_WAITER" | "REQUEST_BILL" | "HELP"; icon: string; en: string; ar: string }[]).map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => setWaiterRequestType(opt.type)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition ${waiterRequestType === opt.type ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="font-semibold text-gray-800">{lang === "ar" ? opt.ar : opt.en}</span>
                  {waiterRequestType === opt.type && <span className="ml-auto text-orange-500">✓</span>}
                </button>
              ))}
            </div>
            <button
              onClick={sendWaiterRequest}
              disabled={sendingRequest}
              style={{ background: brand }}
              className="w-full text-white py-4 rounded-2xl font-bold hover:opacity-90 disabled:opacity-50 transition"
            >
              {sendingRequest ? t("Sending…", "جاري الإرسال...") : t("Send Request", "إرسال الطلب")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
