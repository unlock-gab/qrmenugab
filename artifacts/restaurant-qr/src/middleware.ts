import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;
    const role = token?.role as string | undefined;

    if (pathname.startsWith("/admin")) {
      if (role !== "PLATFORM_ADMIN") {
        const fallback = getRoleHome(role);
        return NextResponse.redirect(new URL(fallback, req.url));
      }
      return NextResponse.next();
    }

    if (role === "PLATFORM_ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    if (role === "STAFF_KITCHEN" && !pathname.startsWith("/kitchen") && !pathname.startsWith("/print")) {
      return NextResponse.redirect(new URL("/kitchen", req.url));
    }
    if (role === "STAFF_WAITER" && !pathname.startsWith("/waiter") && !pathname.startsWith("/print")) {
      return NextResponse.redirect(new URL("/waiter", req.url));
    }
    if (role === "STAFF_CASHIER" && !pathname.startsWith("/cashier") && !pathname.startsWith("/print")) {
      return NextResponse.redirect(new URL("/cashier", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

function getRoleHome(role?: string): string {
  switch (role) {
    case "STAFF_KITCHEN": return "/kitchen";
    case "STAFF_WAITER": return "/waiter";
    case "STAFF_CASHIER": return "/cashier";
    default: return "/dashboard";
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tables/:path*",
    "/categories/:path*",
    "/menu-items/:path*",
    "/orders/:path*",
    "/settings/:path*",
    "/staff/:path*",
    "/subscription/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
    "/kitchen/:path*",
    "/kitchen",
    "/waiter/:path*",
    "/waiter",
    "/cashier/:path*",
    "/cashier",
    "/print/:path*",
  ],
};
