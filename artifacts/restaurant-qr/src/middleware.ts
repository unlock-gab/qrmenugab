import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;
    const role = token?.role as string | undefined;

    // Admin login — public page
    if (pathname === "/admin/login") {
      if (token) return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      return NextResponse.next();
    }

    // Merchant login/register — public pages
    if (pathname === "/merchant/login" || pathname === "/merchant/register") {
      if (token) return NextResponse.redirect(new URL(getRoleHome(role), req.url));
      return NextResponse.next();
    }

    // Admin protected space — requires PLATFORM_ADMIN
    if (pathname.startsWith("/admin")) {
      if (role !== "PLATFORM_ADMIN") {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
      return NextResponse.next();
    }

    // Merchant protected space — must not be admin
    if (role === "PLATFORM_ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // Role-based redirects for staff
    if (role === "STAFF_KITCHEN" && !pathname.startsWith("/merchant/kitchen") && !pathname.startsWith("/print")) {
      return NextResponse.redirect(new URL("/merchant/kitchen", req.url));
    }
    if (role === "STAFF_WAITER" && !pathname.startsWith("/merchant/waiter") && !pathname.startsWith("/print")) {
      return NextResponse.redirect(new URL("/merchant/waiter", req.url));
    }
    if (role === "STAFF_CASHIER" && !pathname.startsWith("/merchant/cashier") && !pathname.startsWith("/print")) {
      return NextResponse.redirect(new URL("/merchant/cashier", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // Login pages are always public
        if (
          pathname === "/merchant/login" ||
          pathname === "/merchant/register" ||
          pathname === "/admin/login"
        ) return true;
        return !!token;
      },
    },
  }
);

function getRoleHome(role?: string): string {
  switch (role) {
    case "PLATFORM_ADMIN": return "/admin/dashboard";
    case "STAFF_KITCHEN": return "/merchant/kitchen";
    case "STAFF_WAITER": return "/merchant/waiter";
    case "STAFF_CASHIER": return "/merchant/cashier";
    default: return "/merchant/dashboard";
  }
}

export const config = {
  matcher: [
    "/merchant/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
    "/print/:path*",
  ],
};
