import Sidebar from "@/app/_components/sidebar";
import { auth } from "@/app/_lib/auth";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { getCurrentUserAuth } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { SubscriptionBanner } from "@/app/_components/SubscriptionBanner";
import { AuthProvider } from "@/app/_components/auth/auth-provider";
import { GlobalHeader } from "@/app/_components/global-header";
import { TooltipProvider } from "@/app/_components/ui/tooltip";
import { getCompanyPlan } from "@/app/_data-access/company/get-company-plan";
import { getUserSecurityStatus } from "@/app/_data-access/user/get-user-security-status";
import { AppModeProvider } from "@/app/_providers/app-mode-provider";
import { SubscriptionProvider } from "@/app/_providers/subscription-context";
import { getSubscriptionStatus } from "@/lib/subscription";
import { headers } from "next/headers";
import { PasswordResetModal } from "./_components/password-reset-modal";

import { LayoutContentWrapper } from "./_components/layout-content-wrapper";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session) {
    redirect("/auth/clear-session?reason=invalid_session");
  }

  // Ensure company exists for the user
  await getCurrentCompanyId();

  const userAuth = await getCurrentUserAuth();
  const role = userAuth?.role ?? UserRole.MEMBER;
  const permissions = userAuth?.permissions ?? [];

  // Check security status
  const { needsPasswordChange } = await getUserSecurityStatus();

  // Subscription & Trial Info
  const { expiresAt } = await getCompanyPlan();
  const resolvedHeaders = await headers();
  const pathname = resolvedHeaders.get("x-pathname") || "";

  // Routes where we should NOT block the user (payment, billing, plans, profile)
  const isEssentialRoute =
    pathname.includes("/plans") ||
    pathname.includes("/checkout") ||
    pathname.includes("/billing-required") ||
    pathname.includes("/profile") ||
    pathname.startsWith("/auth/clear-session");

  // 1. Rigid Subscription Guard (Redirection)
  // Block if NOT an essential route and subscription is expired or null
  const now = new Date();
  const isExpired = !expiresAt || expiresAt < now;

  // LOOP PROTECTION: Never redirect to /plans if we are already there or on an essential route
  if (!isEssentialRoute && isExpired && pathname !== "/plans") {
    redirect("/plans");
  }

  const subscriptionStatus = getSubscriptionStatus(expiresAt);

  return (
    <AuthProvider>
      <TooltipProvider delayDuration={500}>
        <SubscriptionProvider
          subscriptionLevel={subscriptionStatus.level}
          daysRemaining={subscriptionStatus.daysRemaining}
          expiresAt={expiresAt}
        >
          <AppModeProvider>
            <LayoutContentWrapper
              sidebar={<Sidebar />}
              header={<GlobalHeader />}
              banner={<SubscriptionBanner />}
              pathname={pathname}
              role={role}
              permissions={permissions}
            >
              {children}
            </LayoutContentWrapper>

            <PasswordResetModal isOpen={needsPasswordChange} />
          </AppModeProvider>
        </SubscriptionProvider>
      </TooltipProvider>
    </AuthProvider>
  );
}
