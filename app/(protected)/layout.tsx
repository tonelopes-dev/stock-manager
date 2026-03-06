import Sidebar from "../_components/sidebar";
import { auth } from "../_lib/auth";
import { redirect } from "next/navigation";
import { getCurrentCompanyId } from "../_lib/get-current-company";

import { getUserSecurityStatus } from "../_data-access/user/get-user-security-status";
import { PasswordResetModal } from "./_components/password-reset-modal";
import { getCompanyPlan } from "../_data-access/company/get-company-plan";
import { headers } from "next/headers";
import TrialBanner from "../_components/trial-banner";
import { GlobalHeader } from "../_components/global-header";
import { AppModeProvider } from "../_components/app-mode-provider";

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
  const { subscriptionStatus, stripeCurrentPeriodEnd } = await getCompanyPlan();
  const resolvedHeaders = await headers();
  const pathname = resolvedHeaders.get("x-pathname") || "";

  // Routes where we should NOT block the user (payment, billing, plans)
  const isPaymentRoute =
    pathname.includes("/plans") ||
    pathname.includes("/checkout") ||
    pathname.includes("/billing-required");

  // 1. Subscription Guard (Redirection)
  // Only block if NOT a payment route and status is explicitly invalid
  if (!isPaymentRoute && subscriptionStatus) {
    const invalidStatuses = ["PAST_DUE", "CANCELED", "INCOMPLETE"];
    if (invalidStatuses.includes(subscriptionStatus)) {
      redirect("/billing-required");
    }
  }

  return (
    <AppModeProvider>
      <div className="fixed inset-0 flex flex-col overflow-hidden">
        {/* Omni-Header */}
        <GlobalHeader />

        {/* Trial Banner */}
        {!isPaymentRoute && (
          <TrialBanner
            subscriptionStatus={subscriptionStatus}
            stripeCurrentPeriodEnd={stripeCurrentPeriodEnd}
          />
        )}

        {/* Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-gray-100">{children}</main>
        </div>

        <PasswordResetModal isOpen={needsPasswordChange} />
      </div>
    </AppModeProvider>
  );
}
