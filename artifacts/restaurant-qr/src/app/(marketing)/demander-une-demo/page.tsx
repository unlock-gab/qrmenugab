import { DemoForm } from "@/components/marketing/DemoForm";
import { MessageCircle, CheckCircle2, Phone, Clock } from "lucide-react";

export const metadata = { title: "Demander une démo — QRMenu" };

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-5 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left — info */}
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              <MessageCircle className="w-3.5 h-3.5" /> Démo personnalisée gratuite
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-4 leading-tight">
              Découvrez QRMenu<br />en action
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Notre équipe vous présente la plateforme en direct et répond à toutes vos questions. Pas de pression commerciale.
            </p>

            <div className="space-y-4 mb-10">
              {[
                { icon: "⏱️", title: "30 minutes suffisent", desc: "Une démonstration complète et efficace de la plateforme." },
                { icon: "🎯", title: "Adapté à votre établissement", desc: "Nous configurons la démo selon votre type de restaurant." },
                { icon: "🚀", title: "Opérationnel en 24h", desc: "Après la démo, vous pouvez démarrer immédiatement si vous le souhaitez." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-2xl shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-1">{item.title}</p>
                    <p className="text-gray-500 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-orange-500" />
                <p className="font-bold text-orange-800 text-sm">Ce que vous verrez pendant la démo</p>
              </div>
              <ul className="space-y-1.5 text-sm text-gray-600">
                {[
                  "Configuration des tables et génération des QR codes",
                  "L'expérience de commande côté client",
                  "Gestion des commandes en temps réel",
                  "Tableau de bord et rapports",
                  "Personnalisation et paramètres",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5 shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — form */}
          <div>
            <div className="bg-white rounded-3xl shadow-xl shadow-orange-100/50 border border-orange-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="font-black text-gray-900">Demander une démo</h2>
                  <p className="text-gray-500 text-xs">Nous vous répondons sous 24h</p>
                </div>
              </div>
              <DemoForm />
            </div>

            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" /> +213 XX XX XX XX
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Lun–Ven, 9h–18h
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
