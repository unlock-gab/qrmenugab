"use client";

import { useState, useCallback, useRef } from "react";
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
  restaurant: { id: string; name: string; logoUrl: string | null };
  table: { id: string; tableNumber: string };
  categories: Category[];
};

export function MenuPageClient({ restaurant, table, categories }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [notes, setNotes] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const addToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          imageUrl: item.imageUrl,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((menuItemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItemId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((i) => i.menuItemId !== menuItemId);
      return prev.map((i) =>
        i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  }, []);

  const getQuantity = (id: string) =>
    cart.find((i) => i.menuItemId === id)?.quantity || 0;

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
        items: cart.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
        })),
      }),
    });
    const data = await res.json();
    setOrdering(false);
    if (!res.ok) {
      toast.error(data.error || "Failed to place order");
    } else {
      setOrderPlaced(true);
      setCart([]);
      setNotes("");
      setShowCart(false);
    }
  }, [cart, restaurant.id, table.id, notes]);

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
          <p className="text-gray-600 mb-6">
            Your order has been sent to the kitchen. We will bring it to{" "}
            <strong>Table {table.tableNumber}</strong> shortly.
          </p>
          <button
            onClick={() => setOrderPlaced(false)}
            className="w-full bg-orange-500 text-white py-3 rounded-2xl font-semibold text-sm"
          >
            Order More
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-gradient-to-br from-orange-500 to-amber-500 pt-safe">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {restaurant.logoUrl ? (
              <img src={restaurant.logoUrl} alt={restaurant.name}
                className="w-14 h-14 rounded-2xl object-cover bg-white/20" />
            ) : (
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">🍽️</div>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{restaurant.name}</h1>
              <p className="text-orange-100 text-sm">Table {table.tableNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {categories.length > 1 && (
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 flex gap-1 overflow-x-auto py-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  categoryRefs.current[cat.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="px-4 py-1.5 bg-gray-100 hover:bg-orange-100 hover:text-orange-600 rounded-full text-sm font-medium whitespace-nowrap transition"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {categories.map((cat) => (
          <div key={cat.id} ref={(el) => { categoryRefs.current[cat.id] = el; }}>
            <h2 className="text-lg font-bold text-gray-900 mb-3 px-1">{cat.name}</h2>
            <div className="space-y-3">
              {cat.menuItems.map((item) => {
                const qty = getQuantity(item.id);
                return (
                  <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex gap-4 p-4">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name}
                          className="w-20 h-20 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-20 h-20 bg-orange-50 rounded-xl flex items-center justify-center text-3xl shrink-0">🍽️</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                        )}
                        <p className="text-base font-bold text-orange-500 mt-1">{formatPrice(item.price)}</p>
                      </div>
                    </div>
                    <div className="border-t border-gray-50 px-4 py-3 flex items-center justify-end">
                      {qty === 0 ? (
                        <button
                          onClick={() => addToCart(item)}
                          className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition active:scale-95"
                        >
                          Add to Cart
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 font-bold text-lg flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="font-bold text-gray-900 w-5 text-center">{qty}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-9 h-9 rounded-full bg-orange-500 text-white font-bold text-lg flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {itemCount > 0 && !showCart && (
        <div className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto z-20">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-semibold shadow-xl shadow-orange-200 flex items-center justify-between px-6 active:scale-98 transition"
          >
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-sm font-bold">{itemCount}</span>
            <span>View Cart</span>
            <span className="font-bold">{formatPrice(total)}</span>
          </button>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end">
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
              <button onClick={() => setShowCart(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-lg">&times;</button>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-3">
              {cart.map((item) => (
                <div key={item.menuItemId} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-orange-500 font-semibold">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(item.menuItemId)}
                      className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center">-</button>
                    <span className="font-bold text-gray-900 w-5 text-center">{item.quantity}</span>
                    <button onClick={() => addToCart({ ...item, id: item.menuItemId, description: null, isAvailable: true })}
                      className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center">+</button>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 w-16 text-right">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}

              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Add a note</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or allergies..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  rows={2}
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-100">
              <div className="flex justify-between mb-4">
                <span className="text-gray-600">Total</span>
                <span className="text-xl font-bold text-gray-900">{formatPrice(total)}</span>
              </div>
              <button
                onClick={placeOrder}
                disabled={ordering}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-bold text-base transition disabled:opacity-60 shadow-lg shadow-orange-200"
              >
                {ordering ? "Placing order..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
