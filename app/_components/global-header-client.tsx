"use client";

import { ContextSwitcher } from "@/app/_components/context-switcher";
import { HeaderMobileMenu } from "@/app/_components/header-mobile-menu";
import { NotificationCenter } from "@/app/_components/notification-center";
import { QuickActions } from "@/app/_components/quick-actions";
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
        <div className="hidden md:block">
          {userProfile}
        </div>
        <SubscriptionStatusIcon />
        <NotificationCenter companyId={companyId} />
        <QuickActions />
        <HeaderMobileMenu userProfile={userProfile} />
      </div>
    </>
  );
};
