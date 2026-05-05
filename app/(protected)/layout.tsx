import Sidebar from "@/app/_components/sidebar";
import { auth } from "@/app/_lib/auth";
import { redirect } from "next/navigation";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

import { getUserSecurityStatus } from "@/app/_data-access/user/get-user-security-status";
import { PasswordResetModal } from "./_components/password-reset-modal";
import { getCompanyPlan } from "@/app/_data-access/company/get-company-plan";
import { headers } from "next/headers";
import { getSubscriptionStatus } from "@/lib/subscription";
import { SubscriptionBanner } from "@/app/_components/SubscriptionBanner";
import { GlobalHeader } from "@/app/_components/global-header";
import { AppModeProvider } from "@/app/_components/app-mode-provider";
import { SubscriptionProvider } from "@/app/_components/SubscriptionContext";
import { AuthProvider } from "@/app/_components/auth/auth-provider";
import { TooltipProvider } from "@/app/_components/ui/tooltip";
import { cn } from "@/app/_lib/utils";

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
            <div className="fixed inset-0 flex overflow-hidden">
              <Sidebar />
              
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Omni-Header */}
                <GlobalHeader />

                {/* Subscription Alert Banner */}
                <SubscriptionBanner />

                <main className={cn(
                  "flex-1 bg-muted",
                  pathname.startsWith("/kds") ? "overflow-hidden" : "overflow-y-auto"
                )}>
                  {children}
                </main>
              </div>

              <PasswordResetModal isOpen={needsPasswordChange} />
            </div>
          </AppModeProvider>
        </SubscriptionProvider>
      </TooltipProvider>
    </AuthProvider>
  );
}
