"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const ownerNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "◉" },
  { href: "/orders", label: "Orders", icon: "📋" },
  { href: "/tables", label: "Tables", icon: "⊞" },
  { href: "/categories", label: "Categories", icon: "≡" },
  { href: "/menu-items", label: "Menu Items", icon: "✦" },
  { href: "/staff", label: "Staff", icon: "👥" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

const staffNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "◉" },
  { href: "/orders", label: "Orders", icon: "📋" },
  { href: "/tables", label: "Tables", icon: "⊞" },
  { href: "/menu-items", label: "Menu Items", icon: "✦" },
];

type User = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const isOwner = user.role === "MERCHANT_OWNER";
  const navItems = isOwner ? ownerNavItems : staffNavItems;

  return (
    <aside className="w-60 bg-gray-950 flex flex-col h-full shrink-0 border-r border-gray-800/50">
      <div className="p-5 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">Q</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">QR Menu</p>
            <p className="text-gray-500 text-xs">{isOwner ? "Owner" : "Staff"}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-orange-500/15 text-orange-400 font-semibold"
                  : "text-gray-500 hover:text-gray-200 hover:bg-gray-800/60"
              )}
            >
              <span className="text-base w-4 text-center shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {isOwner && (
          <div className="pt-2 mt-2 border-t border-gray-800/50">
            <p className="px-3 py-1 text-xs text-gray-600 font-semibold uppercase tracking-widest">Account</p>
            <Link
              href="/subscription"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                pathname === "/subscription"
                  ? "bg-orange-500/15 text-orange-400 font-semibold"
                  : "text-gray-500 hover:text-gray-200 hover:bg-gray-800/60"
              )}
            >
              <span className="text-base w-4 text-center shrink-0">📦</span>
              Subscription
            </Link>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-gray-800/50">
        <div className="px-3 py-2 mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
