import Sidebar from "../_components/sidebar";
import { Toaster } from "sonner";
import { auth } from "../_lib/auth";
import { redirect } from "next/navigation";
import { getCurrentCompanyId } from "../_lib/get-current-company";
import { getOnboardingStatus } from "../_data-access/onboarding/get-onboarding-status";
import { OnboardingModal } from "./_components/onboarding-modal";

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

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-gray-100">
        {children}
      </main>
      <OnboardingModal isOpen={needsOnboarding} />
      <Toaster />
    </div>
  );
}
