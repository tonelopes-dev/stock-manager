"use client";

import { ContextSwitcher } from "./context-switcher";
import { QuickActions } from "./quick-actions";
import { NotificationCenter } from "./notification-center";
import { SubscriptionStatusIcon } from "./SubscriptionStatusIcon";

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
