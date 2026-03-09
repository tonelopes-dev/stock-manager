import Sidebar from "../_components/sidebar";
import { auth } from "../_lib/auth";
import { redirect } from "next/navigation";
import { getCurrentCompanyId } from "../_lib/get-current-company";

import { getUserSecurityStatus } from "../_data-access/user/get-user-security-status";
import { PasswordResetModal } from "./_components/password-reset-modal";
import { getCompanyPlan } from "../_data-access/company/get-company-plan";
import { headers } from "next/headers";
import { getSubscriptionStatus } from "@/lib/subscription";
import { SubscriptionBanner } from "../_components/SubscriptionBanner";
import { GlobalHeader } from "../_components/global-header";
import { AppModeProvider } from "../_components/app-mode-provider";
import { SubscriptionProvider } from "../_components/SubscriptionContext";

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
    pathname.includes("/profile");

  // 1. Rigid Subscription Guard (Redirection)
  // Block if NOT an essential route and subscription is expired or null
  const now = new Date();
  const isExpired = !expiresAt || expiresAt < now;

  if (!isEssentialRoute && isExpired) {
    redirect("/plans");
  }

  const subscriptionStatus = getSubscriptionStatus(expiresAt);

  return (
    <SubscriptionProvider
      subscriptionLevel={subscriptionStatus.level}
      daysRemaining={subscriptionStatus.daysRemaining}
    >
      <AppModeProvider>
        <div className="fixed inset-0 flex flex-col overflow-hidden">
          {/* Omni-Header */}
          <GlobalHeader />

          {/* Subscription Alert Banner */}
          <SubscriptionBanner />

          {/* Sidebar + Content */}
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-gray-100">
              {children}
            </main>
          </div>

          <PasswordResetModal isOpen={needsPasswordChange} />
        </div>
      </AppModeProvider>
    </SubscriptionProvider>
  );
}
