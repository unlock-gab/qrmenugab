import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">Q</span>
              </div>
              <span className="font-black text-white text-lg tracking-tight">QRMenu</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Smart QR ordering for modern restaurants and cafés. Give your customers a faster, better experience.
            </p>
          </div>

          <div>
            <p className="font-semibold text-white text-sm mb-4">Product</p>
            <div className="space-y-3">
              {[
                { href: "/features", label: "Features" },
                { href: "/pricing", label: "Pricing" },
                { href: "/how-it-works", label: "How It Works" },
                { href: "/faq", label: "FAQ" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="block text-sm text-gray-500 hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold text-white text-sm mb-4">Platform</p>
            <div className="space-y-3">
              {[
                { href: "/signup", label: "Start Free Trial" },
                { href: "/login", label: "Sign In" },
                { href: "/contact", label: "Request Demo" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="block text-sm text-gray-500 hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold text-white text-sm mb-4">Company</p>
            <div className="space-y-3">
              {[
                { href: "/contact", label: "Contact Us" },
                { href: "/contact", label: "Sales" },
              ].map((l) => (
                <Link key={l.label} href={l.href} className="block text-sm text-gray-500 hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} QRMenu. All rights reserved.</p>
          <p className="text-xs text-gray-600">Built for restaurants that care about their customers.</p>
        </div>
      </div>
    </footer>
  );
}
