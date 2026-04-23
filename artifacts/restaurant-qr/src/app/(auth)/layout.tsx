import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | QR Menu",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {children}
    </div>
  );
}
