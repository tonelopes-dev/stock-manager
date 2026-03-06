import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { GlobalHeaderClient } from "./global-header-client";
import { HeaderUserProfile } from "./header-user-profile";

export const GlobalHeader = async () => {
  const companyId = await getCurrentCompanyId();

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center border-b border-slate-100 bg-white/95 px-6 backdrop-blur-md">
      {/* Left: Logo + Context Switcher */}
      <div className="flex items-center gap-5">
        <h1 className="text-lg font-black italic tracking-tighter text-primary">
          STOCKY
        </h1>
        <div className="hidden h-6 w-px bg-slate-200 sm:block" />
        <GlobalHeaderClient companyId={companyId || ""} />
      </div>

      {/* Center: Global Search */}
      <div className="flex flex-1 justify-center px-8">
        {/* GlobalSearch is rendered inside GlobalHeaderClient */}
      </div>

      {/* Right: Profile */}
      <div className="flex items-center gap-2">
        <HeaderUserProfile />
      </div>
    </header>
  );
};
