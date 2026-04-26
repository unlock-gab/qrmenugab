"use client";

import { useState } from "react";
import Image from "next/image";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
};

type Category = {
  id: string;
  name: string;
  imageUrl: string | null;
  menuItems: MenuItem[];
};

export function RestaurantMenuClient({ categories }: { categories: Category[] }) {
  const visible = categories.filter((c) => c.menuItems.length > 0);
  const [activeId, setActiveId] = useState<string | null>(null);

  if (visible.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-3">📋</div>
        <p className="font-semibold text-gray-500">Menu bientôt disponible</p>
      </div>
    );
  }

  const activeCat = activeId ? visible.find((c) => c.id === activeId) ?? null : null;
  const shown = activeCat ? [activeCat] : visible;

  return (
    <div>
      <h2 className="text-xl font-black text-gray-900 mb-5">Notre Menu</h2>

      {/* Circular category filter */}
      {visible.length > 1 && (
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none mb-6">
          {/* "Tout" button */}
          <button
            onClick={() => setActiveId(null)}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div
              className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl transition-all ${
                activeId === null
                  ? "border-violet-600 bg-violet-50 shadow-md scale-105"
                  : "border-gray-200 bg-gray-50 hover:border-violet-300"
              }`}
            >
              🍽️
            </div>
            <span
              className={`text-xs font-semibold whitespace-nowrap ${
                activeId === null ? "text-violet-600" : "text-gray-500"
              }`}
            >
              Tout
            </span>
          </button>

          {visible.map((cat) => {
            const isActive = activeId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveId(isActive ? null : cat.id)}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div
                  className={`w-16 h-16 rounded-full border-2 overflow-hidden transition-all ${
                    isActive
                      ? "border-violet-600 shadow-md scale-105"
                      : "border-gray-200 hover:border-violet-300"
                  }`}
                >
                  {cat.imageUrl ? (
                    <Image
                      src={cat.imageUrl}
                      alt={cat.name}
                      width={64}
                      height={64}
                      className={`w-full h-full object-cover transition ${isActive ? "scale-110" : ""}`}
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex items-center justify-center text-xl font-bold ${
                        isActive ? "bg-violet-50 text-violet-600" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {cat.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold whitespace-nowrap ${
                    isActive ? "text-violet-600" : "text-gray-500"
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Items */}
      <div className="space-y-8">
        {shown.map((cat) => (
          <div key={cat.id}>
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              {cat.name}
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {cat.menuItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3 hover:border-violet-200 transition-all"
                >
                  {item.imageUrl ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-2xl">🍽️</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                    <p className="text-orange-600 font-bold text-sm mt-1">
                      {Number(item.price).toFixed(0)} DA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
