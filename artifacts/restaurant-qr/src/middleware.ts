export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/tables/:path*", "/categories/:path*", "/menu-items/:path*", "/orders/:path*"],
};
