import Sidebar from "../_components/sidebar";
import { Toaster } from "sonner";
import { auth } from "../_lib/auth";
import { redirect } from "next/navigation";
import { getCurrentCompanyId } from "../_lib/get-current-company";
import { getOnboardingStatus } from "../_data-access/onboarding/get-onboarding-status";
import { OnboardingModal } from "./_components/onboarding-modal";
import { getUserSecurityStatus } from "../_data-access/user/get-user-security-status";
import { PasswordResetModal } from "./_components/password-reset-modal";
import { getCompanyPlan } from "../_data-access/company/get-company-plan";
import { headers } from "next/headers";
import TrialBanner from "../_components/trial-banner";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  // Ensure company exists for the user
  await getCurrentCompanyId();

  // Check onboarding status
  const { needsOnboarding } = await getOnboardingStatus();

  // Check security status
  const { needsPasswordChange } = await getUserSecurityStatus();

  // Subscription & Trial Info
  const { subscriptionStatus, stripeCurrentPeriodEnd } = await getCompanyPlan();
  const pathname = headers().get("x-pathname") || "";

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
    <div className="fixed inset-0 flex overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {!isPaymentRoute && (
          <TrialBanner
            subscriptionStatus={subscriptionStatus}
            stripeCurrentPeriodEnd={stripeCurrentPeriodEnd}
          />
        )}
        <main className="flex-1 overflow-y-auto bg-gray-100">{children}</main>
      </div>
      <OnboardingModal isOpen={needsOnboarding} />
      <PasswordResetModal isOpen={needsPasswordChange} />
      <Toaster />
    </div>
  );
}


