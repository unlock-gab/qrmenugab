"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: string; exact?: boolean };

const OWNER_NAV: NavItem[] = [
  { href: "/dashboard", label: "الرئيسية", icon: "◉", exact: true },
  { href: "/orders", label: "الطلبات", icon: "📋" },
  { href: "/tables", label: "الطاولات", icon: "⊞" },
  { href: "/categories", label: "التصنيفات", icon: "≡" },
  { href: "/menu-items", label: "عناصر القائمة", icon: "✦" },
  { href: "/promos", label: "كودات الخصم", icon: "🏷️" },
  { href: "/reservations", label: "الحجوزات", icon: "📅" },
  { href: "/reports", label: "التقارير", icon: "📊" },
  { href: "/staff", label: "الموظفون", icon: "👥" },
  { href: "/settings", label: "الإعدادات", icon: "⚙" },
];

const OWNER_OPS_NAV: NavItem[] = [
  { href: "/kitchen", label: "شاشة المطبخ", icon: "🍳" },
  { href: "/waiter", label: "وضع النادل", icon: "🍽️" },
  { href: "/cashier", label: "وضع الكاشير", icon: "💰" },
];

const STAFF_NAV: NavItem[] = [
  { href: "/dashboard", label: "الرئيسية", icon: "◉", exact: true },
  { href: "/orders", label: "الطلبات", icon: "📋" },
  { href: "/tables", label: "الطاولات", icon: "⊞" },
  { href: "/menu-items", label: "القائمة", icon: "✦" },
];

const KITCHEN_NAV: NavItem[] = [
  { href: "/kitchen", label: "شاشة المطبخ", icon: "🍳", exact: true },
];

const WAITER_NAV: NavItem[] = [
  { href: "/waiter", label: "طاولاتي", icon: "🍽️", exact: true },
  { href: "/waiter/new-order", label: "طلب يدوي", icon: "✏️" },
];

const CASHIER_NAV: NavItem[] = [
  { href: "/cashier", label: "المدفوعات", icon: "💰", exact: true },
];

const ROLE_LABELS: Record<string, string> = {
  MERCHANT_OWNER: "مالك",
  MERCHANT_STAFF: "موظف",
  STAFF_KITCHEN: "مطبخ",
  STAFF_WAITER: "نادل",
  STAFF_CASHIER: "كاشير",
};

type User = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const role = user.role ?? "";

  let primaryNav: NavItem[] = [];
  let secondaryNav: NavItem[] = [];
  let accentColor = "orange";

  if (role === "MERCHANT_OWNER") {
    primaryNav = OWNER_NAV;
    secondaryNav = OWNER_OPS_NAV;
    accentColor = "orange";
  } else if (role === "MERCHANT_STAFF") {
    primaryNav = STAFF_NAV;
    secondaryNav = OWNER_OPS_NAV;
    accentColor = "orange";
  } else if (role === "STAFF_KITCHEN") {
    primaryNav = KITCHEN_NAV;
    accentColor = "green";
  } else if (role === "STAFF_WAITER") {
    primaryNav = WAITER_NAV;
    accentColor = "blue";
  } else if (role === "STAFF_CASHIER") {
    primaryNav = CASHIER_NAV;
    accentColor = "violet";
  }

  const gradients: Record<string, string> = {
    orange: "from-orange-400 to-amber-500",
    green: "from-emerald-500 to-green-600",
    blue: "from-blue-500 to-indigo-600",
    violet: "from-violet-500 to-purple-600",
  };
  const activeStyles: Record<string, string> = {
    orange: "bg-orange-500/15 text-orange-400",
    green: "bg-emerald-500/15 text-emerald-400",
    blue: "bg-blue-500/15 text-blue-400",
    violet: "bg-violet-500/15 text-violet-400",
  };
  const gradient = gradients[accentColor];
  const activeStyle = activeStyles[accentColor];

  function isActive(item: NavItem) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  function NavLink({ item }: { item: NavItem }) {
    const active = isActive(item);
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
          active ? `${activeStyle} font-semibold` : "text-gray-500 hover:text-gray-200 hover:bg-gray-800/60"
        )}
      >
        <span className="text-base w-4 text-center shrink-0">{item.icon}</span>
        {item.label}
      </Link>
    );
  }

  return (
    <aside className="w-60 bg-gray-950 flex flex-col h-full shrink-0 border-r border-gray-800/50">
      <div className="p-5 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center shrink-0`}>
            <span className="text-white text-sm font-bold">Q</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">QR Menu</p>
            <p className="text-gray-500 text-xs">{ROLE_LABELS[role] ?? "موظف"}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {primaryNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {secondaryNav.length > 0 && (
          <div className="pt-2 mt-2 border-t border-gray-800/50">
            <p className="px-3 py-1 text-xs text-gray-600 font-semibold uppercase tracking-widest mb-1">العمليات</p>
            {secondaryNav.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        )}

        {(role === "MERCHANT_OWNER" || role === "MERCHANT_STAFF") && (
          <div className="pt-2 mt-2 border-t border-gray-800/50">
            <p className="px-3 py-1 text-xs text-gray-600 font-semibold uppercase tracking-widest">الحساب</p>
            <NavLink item={{ href: "/subscription", label: "الاشتراك", icon: "📦" }} />
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-gray-800/50">
        <div className="px-3 py-2 mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user.name?.[0]?.toUpperCase() ?? "U"}
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
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
