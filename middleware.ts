import { auth } from "@/app/_lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register"];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthApiRoute = pathname.startsWith("/api/auth");
  const isWebhookRoute = pathname.startsWith("/api/webhooks");

  // Allow access to auth API routes and webhooks
  if (isAuthApiRoute || isWebhookRoute) {
    return NextResponse.next();
  }

  // Handle root route
  if (pathname === "/") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  // Redirect logged-in users away from login/register pages
  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  // Redirect non-logged-in users to login page
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/webhooks|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
