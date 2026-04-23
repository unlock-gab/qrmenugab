"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    category: "Getting Started",
    items: [
      {
        q: "Do I need any technical skills to use QRMenu?",
        a: "None at all. If you can use a smartphone, you can set up QRMenu. The entire setup process — from creating your account to printing your first QR code — is guided and takes less than 30 minutes.",
      },
      {
        q: "How long does it take to get my restaurant live?",
        a: "Most restaurants are fully live within 15-30 minutes. You set up your account, add your menu items, create tables, and print QR codes. There's nothing to install and no technical configuration.",
      },
      {
        q: "Do I need special hardware or equipment?",
        a: "No. All you need is any device with a browser (a laptop, tablet, or smartphone). Your customers use their own phone cameras to scan the QR codes — no special scanner hardware needed.",
      },
    ],
  },
  {
    category: "Customer Experience",
    items: [
      {
        q: "Do my customers need to download an app?",
        a: "No. Customers simply point their phone camera at the QR code and the menu opens directly in their browser. There's no app download, no account creation, and no friction. It just works.",
      },
      {
        q: "What devices do customers need?",
        a: "Any modern smartphone with a camera and a browser. This covers over 99% of smartphones sold in the last 5 years — iPhones, Android phones, and everything in between.",
      },
      {
        q: "Can customers see photos and descriptions on the menu?",
        a: "Yes. You can add photos, descriptions, and pricing for every menu item. The customer menu is beautiful and mobile-optimized by default.",
      },
    ],
  },
  {
    category: "Plans & Pricing",
    items: [
      {
        q: "Is there a free trial?",
        a: "Yes. Every plan starts with a 14-day free trial with full access to all features on that plan. No credit card is required to start your trial.",
      },
      {
        q: "Can I switch plans later?",
        a: "Absolutely. You can upgrade or downgrade your plan at any time from your billing settings. Changes take effect immediately.",
      },
      {
        q: "What happens if I reach my plan's limits?",
        a: "The system will notify you when you're approaching your limits (tables, menu items, or staff users). You'll see a clear message with options to upgrade your plan. Existing data is never deleted.",
      },
      {
        q: "Is there a contract or lock-in period?",
        a: "No contracts. No lock-in. You can cancel at any time from your account. We believe in earning your business every month.",
      },
    ],
  },
  {
    category: "Features",
    items: [
      {
        q: "How do I know when a new order comes in?",
        a: "You'll hear an audio alert and see the order appear instantly in your dashboard. The system auto-refreshes every few seconds so you never miss an order. You can also see which orders are new and unseen.",
      },
      {
        q: "Can multiple staff members access the dashboard?",
        a: "Yes. You can add staff user accounts on Growth and Professional plans. Staff members get access to operational pages (orders, tables) while you as the owner control everything.",
      },
      {
        q: "Can I customize the look of my customer menu?",
        a: "Yes. You can set your restaurant's primary brand color, which is applied to your customer menu header and accents. You can also add your logo and restaurant description.",
      },
      {
        q: "Does QRMenu work for cafés or only full restaurants?",
        a: "QRMenu works great for any food and beverage business with physical seating — restaurants, cafés, bistros, bars, food courts, and more.",
      },
    ],
  },
  {
    category: "Technical",
    items: [
      {
        q: "What if there's no internet connection at my restaurant?",
        a: "QRMenu requires an internet connection for both the merchant dashboard and the customer ordering experience. A reliable WiFi connection at your venue is recommended.",
      },
      {
        q: "Is my data secure?",
        a: "Yes. All data is encrypted in transit and stored securely. Each restaurant's data is isolated and private — no other restaurant can access your information.",
      },
      {
        q: "Can I export my menu and order data?",
        a: "We're working on export features. Currently, you can view all your orders and revenue data directly in the dashboard. Reach out to support for custom data requests.",
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left flex items-center justify-between py-5 gap-4"
      >
        <span className="font-semibold text-gray-900 text-sm">{q}</span>
        <ChevronDown className={cn("w-5 h-5 text-gray-400 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="pb-5">
          <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div>
      <div className="bg-gradient-to-br from-gray-50 to-white py-24">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h1 className="text-5xl font-black text-gray-900 mb-5">Frequently asked questions</h1>
          <p className="text-xl text-gray-500">Can't find what you're looking for? <Link href="/contact" className="text-orange-600 font-semibold hover:underline">Reach out to us</Link>.</p>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-5 space-y-14">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-xl font-black text-gray-900 mb-4 pb-3 border-b border-gray-100">{section.category}</h2>
              <div>
                {section.items.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="py-20 bg-gradient-to-br from-orange-500 to-amber-500">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-3xl font-black text-white mb-4">Still have questions?</h2>
          <p className="text-orange-100 mb-8">Our team is happy to help. Book a demo or send us a message.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 font-bold px-8 py-3.5 rounded-2xl hover:bg-orange-50 transition-all">
              Contact Us <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-white/20 text-white font-semibold px-8 py-3.5 rounded-2xl hover:bg-white/30 transition-all border border-white/30">
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
