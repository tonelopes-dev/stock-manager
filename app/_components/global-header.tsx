import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { GlobalHeaderClient } from "./global-header-client";
import { GlobalSearch } from "./global-search";

export const GlobalHeader = async () => {
  const companyId = await getCurrentCompanyId();

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center border-b border-slate-100 bg-white/95 backdrop-blur-md">
      {/* Left Area: Logo (Matches Sidebar Width) */}
      <div className="flex h-full w-56 shrink-0 items-center justify-center border-r border-slate-100">
        <h1 className="text-xl font-black italic leading-none tracking-tighter text-primary">
          STOCKY
        </h1>
      </div>

      {/* Middle Area: Absolutely Centered Search */}
      <div className="pointer-events-none absolute left-1/2 flex -translate-x-10 items-center justify-center">
        <div className="pointer-events-auto">
          <GlobalSearch />
        </div>
      </div>

      {/* Middle & Right Content */}
      <div className="flex h-full flex-1 items-center justify-between px-6">
        <GlobalHeaderClient companyId={companyId || ""} />
      </div>
    </header>
  );
};
