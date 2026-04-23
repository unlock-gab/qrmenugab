"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
};

type Category = {
  id: string;
  name: string;
  menuItems: MenuItem[];
};

type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
};

type Props = {
  restaurant: { id: string; name: string; logoUrl: string | null; currency?: string; primaryColor?: string | null };
  table: { id: string; tableNumber: string };
  categories: Category[];
};

export function MenuPageClient({ restaurant, table, categories }: Props) {
  const brand = restaurant.primaryColor || "#f97316";
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [notes, setNotes] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<{ orderNumber: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || "");
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navRef = useRef<HTMLDivElement | null>(null);

  const allItems = categories.flatMap((c) => c.menuItems);
  const availableItems = allItems.filter((i) => i.isAvailable);

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
    Object.values(categoryRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToCategory = (catId: string) => {
    categoryRefs.current[catId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    const btn = document.getElementById(`nav-${catId}`);
    btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  const addToCart = useCallback((item: MenuItem) => {
    if (!item.isAvailable) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1, imageUrl: item.imageUrl }];
    });
  }, []);

  const removeFromCart = useCallback((menuItemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItemId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((i) => i.menuItemId !== menuItemId);
      return prev.map((i) => i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  }, []);

  const getQuantity = (id: string) => cart.find((i) => i.menuItemId === id)?.quantity || 0;
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

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
        items: cart.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
      }),
    });
    const data = await res.json();
    setOrdering(false);
    if (!res.ok) {
      toast.error(data.error || "Failed to place order. Please try again.");
    } else {
      setOrderPlaced({ orderNumber: data.orderNumber });
      setCart([]);
      setNotes("");
      setShowCart(false);
    }
  }, [cart, restaurant.id, table.id, notes]);

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm w-full">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
            <span className="text-4xl">✓</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Order Placed!</h2>
          <p className="text-gray-500 text-sm mb-1">Order <strong className="text-gray-800">{orderPlaced.orderNumber}</strong></p>
          <p className="text-gray-500 text-sm mb-8">
            Your order has been sent to the kitchen. We&apos;ll bring it to{" "}
            <strong className="text-gray-800">Table {table.tableNumber}</strong> shortly.
          </p>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-orange-700">
              🕐 Estimated wait time: <strong>15–20 minutes</strong>
            </p>
          </div>
          <button
            onClick={() => setOrderPlaced(null)}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-gray-800 transition active:scale-95"
          >
            Order More Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div style={{ background: `linear-gradient(135deg, ${brand}, ${brand}cc)` }}>
        <div className="max-w-lg mx-auto px-4 py-5 flex items-center gap-4">
          {restaurant.logoUrl ? (
            <img src={restaurant.logoUrl} alt={restaurant.name} className="w-12 h-12 rounded-xl object-cover bg-white/20 shrink-0" />
          ) : (
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl shrink-0">🍽️</div>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-black text-white leading-tight truncate">{restaurant.name}</h1>
            <p className="text-white/80 text-sm">Table {table.tableNumber}</p>
          </div>
          {itemCount > 0 && (
            <button
              onClick={() => setShowCart(true)}
              className="ml-auto shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl text-sm font-bold transition"
            >
              🛒 {itemCount}
            </button>
          )}
        </div>
      </div>

      {categories.length > 1 && (
        <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
          <div ref={navRef} className="max-w-lg mx-auto px-4 flex gap-1 overflow-x-auto py-2.5 scrollbar-none">
            {categories.map((cat) => (
              <button
                id={`nav-${cat.id}`}
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition shrink-0 ${
                  activeCategory === cat.id
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-4 space-y-8 pb-36">
        {categories.map((cat) => (
          <div
            key={cat.id}
            id={`cat-${cat.id}`}
            ref={(el) => { categoryRefs.current[cat.id] = el; }}
          >
            <h2 className="text-base font-black text-gray-900 mb-3 px-1 flex items-center gap-2">
              {cat.name}
              <span className="text-xs font-normal text-gray-400">
                ({cat.menuItems.filter((i) => i.isAvailable).length} items)
              </span>
            </h2>
            <div className="space-y-3">
              {cat.menuItems.map((item) => {
                const qty = getQuantity(item.id);
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition ${
                      item.isAvailable ? "border-gray-100" : "border-gray-100 opacity-60"
                    }`}
                  >
                    <div className="flex gap-3 p-4">
                      <div className="shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-24 h-24 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-orange-50 rounded-xl flex items-center justify-center text-3xl">🍽️</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm leading-tight">{item.name}</h3>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                        )}
                        <p className="text-base font-black text-orange-500 mt-2">{formatPrice(item.price)}</p>
                        {!item.isAvailable && (
                          <span className="inline-block mt-1 text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-semibold">
                            Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                    {item.isAvailable && (
                      <div className="px-4 pb-4 flex justify-end">
                        {qty === 0 ? (
                          <button
                            onClick={() => addToCart(item)}
                            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition active:scale-95"
                          >
                            Add to cart
                          </button>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 font-black text-lg flex items-center justify-center active:scale-90 transition"
                            >
                              −
                            </button>
                            <span className="font-black text-gray-900 w-6 text-center text-base">{qty}</span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-9 h-9 rounded-full bg-orange-500 text-white font-black text-lg flex items-center justify-center active:scale-90 transition"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {availableItems.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">😔</p>
            <p className="text-gray-500 font-medium">No items available right now</p>
          </div>
        )}
      </div>

      {itemCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto z-20">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-2xl flex items-center justify-between px-5 active:scale-98 transition hover:bg-gray-800"
          >
            <span className="bg-white/15 px-2.5 py-1 rounded-xl text-sm font-black">{itemCount}</span>
            <span className="text-sm font-bold">View Cart</span>
            <span className="font-black text-sm">{formatPrice(total)}</span>
          </button>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-end">
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-black text-gray-900">Your Cart</h2>
                <p className="text-xs text-gray-400 mt-0.5">{itemCount} item{itemCount !== 1 ? "s" : ""} · Table {table.tableNumber}</p>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xl leading-none hover:bg-gray-200 transition"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
              {cart.map((item) => (
                <div key={item.menuItemId} className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0 text-lg">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-xl object-cover" />
                    ) : "🍽️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-orange-500 font-bold">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => removeFromCart(item.menuItemId)}
                      className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center text-base active:scale-90 transition"
                    >
                      −
                    </button>
                    <span className="font-black text-gray-900 w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => addToCart({ ...item, id: item.menuItemId, description: null, isAvailable: true })}
                      className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-base active:scale-90 transition"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm font-black text-gray-900 w-16 text-right shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">🛒</p>
                  <p className="text-gray-500 text-sm">Your cart is empty</p>
                </div>
              )}

              <div className="pt-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Special instructions (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Allergies, preferences, extra sauce..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-gray-50"
                  rows={2}
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500">Order total</p>
                  <p className="text-2xl font-black text-gray-900">{formatPrice(total)}</p>
                </div>
                <p className="text-xs text-gray-400">Table {table.tableNumber}</p>
              </div>
              <button
                onClick={placeOrder}
                disabled={ordering || cart.length === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-base transition disabled:opacity-60 shadow-lg shadow-orange-200 active:scale-98"
              >
                {ordering ? "Placing your order..." : "Place Order →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
