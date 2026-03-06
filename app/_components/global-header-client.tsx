"use client";

import { ContextSwitcher } from "./context-switcher";
import { GlobalSearch } from "./global-search";
import { QuickActions } from "./quick-actions";
import { NotificationCenter } from "./notification-center";

interface GlobalHeaderClientProps {
  companyId: string;
}

export const GlobalHeaderClient = ({ companyId }: GlobalHeaderClientProps) => {
  return (
    <>
      {/* Context Switcher (left area) */}
      <div className="hidden sm:block">
        <ContextSwitcher />
      </div>

      {/* Center: Search */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <GlobalSearch />
      </div>

      {/* Right side actions (positioned before the profile via flex order) */}
      <div className="ml-auto mr-4 flex items-center gap-2">
        <NotificationCenter companyId={companyId} />
        <QuickActions />
      </div>
    </>
  );
};
