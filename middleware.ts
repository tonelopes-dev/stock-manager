import NextAuth from "next-auth";
import { authConfig } from "@/app/_lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

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
  const isRestorePage = pathname === "/settings/company/restore";

  // Allow access to auth API routes and webhooks
  if (isAuthApiRoute || isWebhookRoute) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from login/register pages
  // UNLESS there is a reason/error param (indicating a forced logout/session invalidation from the server)
  const hasError = req.nextUrl.searchParams.has("error") || req.nextUrl.searchParams.has("reason");
  const reason = req.nextUrl.searchParams.get("reason");

  // Agressive session clearing for specific events
  if (reason === "ownership_transferred" && pathname !== "/auth/clear-session") {
    return NextResponse.redirect(new URL("/auth/clear-session", req.nextUrl.origin));
  }

  // Handle root route
  if (pathname === "/") {
    if (isLoggedIn && !hasError) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  if (isLoggedIn && !hasError && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  // Redirect non-logged-in users to login page
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  // 2. Role-Based Route Protection (Layer 1)
  if (isLoggedIn) {
     const role = req.auth?.user?.role;
     const subscriptionStatus = req.auth?.user?.subscriptionStatus;
     const companyDeletedAt = req.auth?.user?.companyDeletedAt;

     // 2.1 Lifecycle Guard: Soft Delete
     if (companyDeletedAt && !isRestorePage && !pathname.startsWith("/_actions")) {
        // If pending deletion: Only OWNER can go to restore page. Others are blocked.
        if (role === "OWNER") {
          return NextResponse.redirect(new URL("/settings/company/restore", req.nextUrl.origin));
        } else {
          // Non-owners see a "Deactivated" message or just logout
          return NextResponse.redirect(new URL("/login?reason=company_deactivated", req.nextUrl.origin));
        }
     }

     // 2.2 Lifecycle Guard: Subscription (Suspended)
     // Allowed statuses for app access: ACTIVE, TRIALING
     const restrictedStatuses = ["PAST_DUE", "CANCELED", "INCOMPLETE"];
     if (restrictedStatuses.includes(subscriptionStatus as string) && pathname !== "/billing-required" && !isPublicRoute) {
        // Only allow OWNER/ADMIN to access billing/settings to fix it? 
        // For now, redirect everyone to the billing required page.
        return NextResponse.redirect(new URL("/billing-required", req.nextUrl.origin));
     }
     
     // 2.3 RBAC: Action Guard
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


