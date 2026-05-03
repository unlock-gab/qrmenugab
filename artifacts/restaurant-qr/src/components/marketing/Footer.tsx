import Link from "next/link";
import { QrCode, MapPin } from "lucide-react";

export function Footer() {
  const columns = [
    {
      title: "Découvrir",
      links: [
        { href: "/restaurants",   label: "Établissements" },
        { href: "/features",      label: "Fonctionnalités" },
        { href: "/how-it-works",  label: "Comment ça marche" },
        { href: "/pricing",       label: "Tarifs" },
        { href: "/faq",           label: "FAQ" },
      ],
    },
    {
      title: "Plateforme",
      links: [
        { href: "/signup",           label: "Essai gratuit 14 jours" },
        { href: "/merchant/login",   label: "Espace marchand" },
        { href: "/contact",          label: "Demander une démo" },
        { href: "/admin/login",      label: "Administration" },
      ],
    },
    {
      title: "Contact",
      links: [
        { href: "/contact",          label: "Nous contacter" },
        { href: "/contact",          label: "Vente & partenariat" },
        { href: "/demander-une-demo", label: "Planifier une démo" },
      ],
    },
  ];

  return (
    <footer className="bg-gray-950 text-gray-400">
      {/* Top section */}
      <div className="max-w-6xl mx-auto px-5 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">

          {/* Brand column */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/40">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-white text-xl tracking-tight">
                QR<span className="text-violet-400">Menu</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-5">
              La solution de commande QR pour restaurants et cafés modernes en Algérie.
              Menu digital, commandes en temps réel, gestion complète.
            </p>
            {/* Location badge */}
            <div className="inline-flex items-center gap-2 bg-gray-800/60 border border-gray-700/50 text-gray-400 text-xs px-3 py-2 rounded-full">
              <MapPin className="w-3.5 h-3.5 text-violet-400" />
              Algérie — Paiement en DZD
            </div>
          </div>

          {/* Navigation columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <p className="font-bold text-white text-sm mb-5">{col.title}</p>
              <div className="space-y-3.5">
                {col.links.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="block text-sm text-gray-500 hover:text-white transition-colors duration-150"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="border-t border-gray-800/60">
        <div className="max-w-6xl mx-auto px-5 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { value: "500+",    label: "Restaurants" },
              { value: "50 000+", label: "Commandes" },
              { value: "4.8★",   label: "Satisfaction" },
              { value: "< 1h",    label: "Mise en place" },
            ].map((s) => (
              <div key={s.value}>
                <div className="text-lg font-black text-white">{s.value}</div>
                <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800/60">
        <div className="max-w-6xl mx-auto px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} QRMenu. Tous droits réservés.
          </p>
          <p className="text-xs text-gray-600">
            Conçu avec ❤️ pour les restaurants qui tiennent à leurs clients.
          </p>
        </div>
      </div>
    </footer>
  );
}
