import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;
    const role = token?.role as string | undefined;

    if (pathname.startsWith("/admin")) {
      if (role !== "PLATFORM_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    } else {
      if (role === "PLATFORM_ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

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
  ],
};
