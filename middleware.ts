import { auth } from "@/app/_lib/auth";
import { NextResponse } from "next/server";

export default auth(async (req) => {

  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // 1. Loop Protection & Public Routes
  if (pathname === "/billing-required") {
    return NextResponse.next();
  }

  const publicRoutes = ["/", "/login", "/register", "/plans", "/checkout", "/checkout/success"];
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

  // 2. Role-Based Route Protection (Layer 1)
  if (isLoggedIn) {
     const role = req.auth?.user?.role;
     
     // OWNER: Can access everything
     // ADMIN: Cannot access /plans (Billing)
     if (role === "ADMIN" && pathname.startsWith("/plans")) {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
     }

     // MEMBER: Cannot access /plans OR /settings/team
     if (role === "MEMBER") {
        if (pathname.startsWith("/plans") || pathname.startsWith("/settings/team")) {
          return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
        }
     }
  }

  // 3. Inject Pathname into Headers (for Server Components)

  // This allows the ProtectedLayout to perform the subscription guard check safely on the server
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});


export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};


