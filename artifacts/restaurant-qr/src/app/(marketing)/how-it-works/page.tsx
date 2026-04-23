import Link from "next/link";
import { ArrowRight, Check, QrCode, Smartphone, BarChart3, Printer, ChefHat } from "lucide-react";

export const metadata = { title: "How It Works — QRMenu" };

export default function HowItWorksPage() {
  return (
    <div>
      <div className="bg-gradient-to-br from-gray-50 to-white py-24">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h1 className="text-5xl font-black text-gray-900 mb-5">How QRMenu works</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            From signup to your first live order — a simple 4-step process that takes less than 30 minutes.
          </p>
        </div>
      </div>

      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-5">
          <div className="space-y-20">
            {[
              {
                step: "01",
                icon: ChefHat,
                title: "Create your account and set up your restaurant",
                desc: "Sign up for a free trial in under 2 minutes. Then add your restaurant name, description, currency, and brand colors. Upload your logo to make it yours.",
                color: "bg-orange-500",
                points: [
                  "Complete profile in one simple form",
                  "No technical skills required",
                  "Works on any device — mobile or desktop",
                  "Your account is ready in seconds",
                ],
              },
              {
                step: "02",
                icon: QrCode,
                title: "Build your digital menu and add your tables",
                desc: "Add your menu categories (Starters, Mains, Drinks...) and items with names, photos, descriptions, and prices. Then create tables — the system auto-generates QR codes for each.",
                color: "bg-blue-500",
                points: [
                  "Organize items into categories",
                  "Add photos and descriptions",
                  "Toggle item availability in real-time",
                  "QR codes generated automatically per table",
                ],
              },
              {
                step: "03",
                icon: Printer,
                title: "Print your QR codes and you're live",
                desc: "Download and print the QR codes for each table. Place them on table tents, frames, or stickers. Your restaurant is now live — customers can start ordering immediately.",
                color: "bg-green-500",
                points: [
                  "Download QR codes as printable images",
                  "Use any printer — home or professional",
                  "QR codes work permanently",
                  "No special QR code equipment needed",
                ],
              },
              {
                step: "04",
                icon: BarChart3,
                title: "Manage orders in real time from your dashboard",
                desc: "When a customer places an order, you hear a notification and see it instantly in your dashboard. Update the order status as you prepare and deliver it. Track revenue and performance at a glance.",
                color: "bg-purple-500",
                points: [
                  "Live order feed — no page refreshing needed",
                  "Audio alerts for new orders",
                  "One-click status updates",
                  "Daily revenue and order tracking",
                ],
              },
            ].map((s, i) => (
              <div key={s.step} className={`grid lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                <div>
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-12 h-12 ${s.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <s.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-6xl font-black text-gray-100">{s.step}</span>
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-4">{s.title}</h2>
                  <p className="text-gray-500 text-lg leading-relaxed mb-6">{s.desc}</p>
                  <div className="space-y-3">
                    {s.points.map((p) => (
                      <div key={p} className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-gray-700 text-sm">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl p-10 flex items-center justify-center min-h-64 ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                  <div className="text-center">
                    <div className={`w-24 h-24 ${s.color} rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl`}>
                      <s.icon className="w-12 h-12 text-white" />
                    </div>
                    <p className="text-gray-400 font-semibold">Step {s.step}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">What your customers see</h2>
            <p className="text-gray-500">A beautiful, fast mobile ordering experience — from scan to order confirmation.</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {["Scan QR code", "Browse menu & add to cart", "Order placed — wait & enjoy"].map((label, i) => (
              <div key={label} className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-orange-600 font-black text-sm">{i + 1}</span>
                </div>
                <p className="text-sm font-semibold text-gray-700">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-20 bg-gradient-to-br from-orange-500 to-amber-500">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-4xl font-black text-white mb-5">Start in 15 minutes</h2>
          <p className="text-orange-100 text-xl mb-8">Free 14-day trial. No credit card required. Cancel anytime.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-10 py-4 rounded-2xl text-lg hover:bg-orange-50 transition-all shadow-xl">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
