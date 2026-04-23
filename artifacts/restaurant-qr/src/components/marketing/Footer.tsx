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
              Commande QR pour restaurants et cafés modernes en Algérie. Offrez à vos clients une expérience plus rapide et plus agréable.
            </p>
          </div>

          <div>
            <p className="font-semibold text-white text-sm mb-4">Découvrir</p>
            <div className="space-y-3">
              {[
                { href: "/restaurants", label: "Établissements" },
                { href: "/features", label: "Fonctionnalités" },
                { href: "/pricing", label: "Tarifs" },
                { href: "/faq", label: "FAQ" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="block text-sm text-gray-500 hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold text-white text-sm mb-4">Plateforme</p>
            <div className="space-y-3">
              {[
                { href: "/signup", label: "Essai gratuit" },
                { href: "/merchant/login", label: "Espace marchand" },
                { href: "/admin/login", label: "Administration" },
                { href: "/contact", label: "Demander une démo" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="block text-sm text-gray-500 hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold text-white text-sm mb-4">Contact</p>
            <div className="space-y-3">
              {[
                { href: "/contact", label: "Nous contacter" },
                { href: "/contact", label: "Vente & partenariat" },
              ].map((l) => (
                <Link key={l.label} href={l.href} className="block text-sm text-gray-500 hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} QRMenu. Tous droits réservés.</p>
          <p className="text-xs text-gray-600">Conçu pour les restaurants qui tiennent à leurs clients.</p>
        </div>
      </div>
    </footer>
  );
}
