import { ContactForm } from "./ContactForm";
import { MapPin, Mail, MessageSquare, Clock } from "lucide-react";

export const metadata = { title: "Contact — QRMenu" };

export default function ContactPage() {
  return (
    <div>
      <div className="bg-gradient-to-br from-gray-50 to-white py-24">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h1 className="text-5xl font-black text-gray-900 mb-5">Get in touch</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Have questions? Want a demo? We'd love to hear from you. Fill in the form and we'll respond within one business day.
          </p>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">Send us a message</h2>
              <p className="text-gray-500 mb-8">Tell us about your restaurant and we'll get back to you quickly.</p>
              <ContactForm />
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-6">Why reach out?</h2>
                <div className="space-y-5">
                  {[
                    { icon: MessageSquare, title: "Request a demo", desc: "See QRMenu live with your restaurant's setup. Takes 20 minutes." },
                    { icon: Mail, title: "Sales questions", desc: "Want to discuss a custom plan or have pricing questions? We're here." },
                    { icon: Clock, title: "Quick response", desc: "We respond to all messages within one business day, often much faster." },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm mb-1">{item.title}</p>
                        <p className="text-gray-500 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-orange-50 rounded-2xl p-7">
                <p className="font-black text-gray-900 mb-3">Ready to dive in right now?</p>
                <p className="text-gray-600 text-sm mb-5">
                  You can start your free 14-day trial instantly — no credit card, no setup fee.
                </p>
                <a href="/signup" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all">
                  Start Free Trial →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
