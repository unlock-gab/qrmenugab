import Link from "next/link";
import { QrCode, BarChart3, ChefHat, Bell, Smartphone, Settings, Users, Table, Wifi, Shield, ArrowRight, Check, Zap } from "lucide-react";

export const metadata = { title: "Features — QRMenu" };

const featureGroups = [
  {
    title: "QR Table Ordering",
    description: "Replace paper menus and manual order-taking with a seamless QR-powered experience.",
    icon: QrCode,
    color: "from-orange-500 to-amber-500",
    features: [
      "Unique QR code per table — auto-generated",
      "Customers scan with any smartphone camera",
      "No app download or login required",
      "Works on all modern browsers",
      "Instant order submission to the kitchen",
      "Real-time order status updates for guests",
    ],
  },
  {
    title: "Digital Menu Management",
    description: "Build and manage your digital menu in minutes. Update prices, items, and availability instantly.",
    icon: ChefHat,
    color: "from-green-500 to-emerald-500",
    features: [
      "Unlimited menu categories and subcategories",
      "Add photos, descriptions, and prices",
      "Toggle item availability instantly",
      "Sort items with drag-and-drop",
      "Apply changes that appear live immediately",
      "Organize by breakfast, lunch, dinner, specials",
    ],
  },
  {
    title: "Real-Time Order Dashboard",
    description: "Manage every order from a single, live dashboard designed for fast-paced restaurant operations.",
    icon: BarChart3,
    color: "from-blue-500 to-indigo-500",
    features: [
      "Live order feed — new orders appear instantly",
      "One-click status updates (New → Preparing → Ready)",
      "Order detail view with all item info",
      "Audio notification alert for new orders",
      "Revenue tracking with daily summaries",
      "Filter orders by status or table",
    ],
  },
  {
    title: "Table Management",
    description: "Set up your restaurant floor digitally with smart table organization and QR code generation.",
    icon: Table,
    color: "from-purple-500 to-violet-500",
    features: [
      "Create unlimited tables per your plan",
      "Auto-generate unique QR tokens per table",
      "Download or print QR codes instantly",
      "Activate or deactivate tables",
      "Unique table-scoped ordering links",
      "Track active vs idle tables",
    ],
  },
  {
    title: "Smart Notifications",
    description: "Never miss an order with real-time alerts that keep your staff on top of every table.",
    icon: Bell,
    color: "from-rose-500 to-pink-500",
    features: [
      "Audio alert for new incoming orders",
      "Browser notification badge",
      "Auto-refreshing order dashboard",
      "Mark orders as seen to clear alerts",
      "Per-restaurant notification settings",
      "Works on any device — PC, tablet, phone",
    ],
  },
  {
    title: "Restaurant Branding",
    description: "Make your digital presence feel like your brand. Consistent identity builds customer trust.",
    icon: Settings,
    color: "from-amber-500 to-yellow-500",
    features: [
      "Custom primary brand color",
      "Restaurant name and logo display",
      "Branded customer-facing menu pages",
      "Custom restaurant description",
      "Address and contact info on menu",
      "White-label customer experience",
    ],
  },
  {
    title: "Staff Management",
    description: "Give your team the right level of access to keep operations running smoothly.",
    icon: Users,
    color: "from-teal-500 to-cyan-500",
    features: [
      "Add multiple staff accounts per restaurant",
      "Role-based access (Owner vs Staff)",
      "Staff members access operational pages only",
      "Activate or deactivate staff accounts",
      "Plan-limited staff user count",
      "Centralized team management dashboard",
    ],
  },
  {
    title: "Mobile Customer Experience",
    description: "Your customers get a premium mobile experience that makes ordering a pleasure.",
    icon: Smartphone,
    color: "from-sky-500 to-blue-500",
    features: [
      "Fully responsive mobile-first design",
      "Fast menu loading on any connection",
      "Cart with add/remove and quantity control",
      "Order notes for special instructions",
      "Order confirmation screen",
      "Clean category navigation",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div>
      <div className="bg-gradient-to-br from-gray-50 to-white py-24">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3 h-3" /> All features included from day one
          </div>
          <h1 className="text-5xl font-black text-gray-900 mb-5">
            Everything your restaurant needs to thrive
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            QRMenu is packed with professional features built specifically for cafés and restaurants. No complicated setup, no technical skills required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-orange-200">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-2xl hover:bg-gray-50 transition-all">
              View Pricing
            </Link>
          </div>
        </div>
      </div>

      <div className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-5 space-y-16">
          {featureGroups.map((group, i) => (
            <div key={group.title} className={`grid lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${group.color} flex items-center justify-center mb-5 shadow-lg`}>
                  <group.icon className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4">{group.title}</h2>
                <p className="text-gray-500 text-lg leading-relaxed mb-7">{group.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700 text-sm">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`bg-gradient-to-br ${group.color} rounded-3xl p-1 shadow-2xl ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                <div className="bg-white rounded-[20px] p-8 min-h-48 flex items-center justify-center">
                  <group.icon className={`w-24 h-24 bg-gradient-to-br ${group.color} bg-clip-text text-transparent opacity-20`} />
                  <div className="text-center">
                    <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${group.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <group.icon className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">{group.title}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="py-20 bg-gradient-to-br from-orange-500 to-amber-500">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-4xl font-black text-white mb-5">Ready to get started?</h2>
          <p className="text-orange-100 text-xl mb-8">Start your free 14-day trial — all features included, no credit card needed.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-10 py-4 rounded-2xl text-lg hover:bg-orange-50 transition-all shadow-xl">
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
