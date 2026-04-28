"use client";

import { ContextSwitcher } from "@/app/_components/context-switcher";
import { QuickActions } from "@/app/_components/quick-actions";
import { NotificationCenter } from "@/app/_components/notification-center";
import { SubscriptionStatusIcon } from "@/app/_components/SubscriptionStatusIcon";

interface GlobalHeaderClientProps {
  companyId: string;
  userProfile?: React.ReactNode;
}

export const GlobalHeaderClient = ({
  companyId,
  userProfile,
}: GlobalHeaderClientProps) => {
  return (
    <>
      {/* Context Switcher (left area) */}
      <div className="hidden sm:block">
        <ContextSwitcher />
      </div>

      {/* Right side actions */}
      <div className="ml-auto mr-4 flex items-center gap-2">
        {userProfile}
        <SubscriptionStatusIcon />
        <NotificationCenter companyId={companyId} />
        <QuickActions />
      </div>
    </>
  );
};
