import NextAuth from "next-auth";
import { authConfig } from "@/app/_lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const publicRoutes = ["/", "/login", "/register", "/plans", "/checkout", "/checkout/success"];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthApiRoute = pathname.startsWith("/api/auth");

  if (isAuthApiRoute) {
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
