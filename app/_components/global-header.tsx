import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { GlobalHeaderClient } from "./global-header-client";
import { GlobalSearch } from "./global-search";
import { KipoLogo } from "./logo";
import { HeaderUserProfile } from "./header-user-profile";

export const GlobalHeader = async () => {
  const companyId = await getCurrentCompanyId();

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center border-b border-border bg-background/95 backdrop-blur-md">
      {/* Left Area: Logo (Matches Sidebar Width) */}
      <div className="flex h-full w-56 shrink-0 border-r border-border">
        <KipoLogo className="h-16 w-32 pl-6" />
      </div>

      {/* Middle Area: Absolutely Centered Search */}
      <div className="pointer-events-none absolute left-1/2 flex -translate-x-10 items-center justify-center">
        <div className="pointer-events-auto">
          <GlobalSearch />
        </div>
      </div>

      {/* Middle & Right Content */}
      <div className="flex h-full flex-1 items-center justify-between px-6">
        <GlobalHeaderClient
          companyId={companyId || ""}
          userProfile={<HeaderUserProfile />}
        />
      </div>
    </header>
  );
};
