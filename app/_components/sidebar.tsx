import { getCurrentUserAuth } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";
import { KipoLogo } from "./logo";
import { SidebarNav } from "./sidebar-nav";

const Sidebar = async () => {
  const auth = await getCurrentUserAuth();
  const role = auth?.role ?? UserRole.MEMBER;
  const permissions = auth?.permissions ?? [];

  return (
    <div className="group/sidebar hidden md:flex h-full w-20 flex-col border-r border-border bg-background transition-all duration-300 ease-in-out hover:w-56">
      <div className="flex h-16 shrink-0 items-center justify-center border-b group-hover/sidebar:justify-start group-hover/sidebar:pl-6">
        <KipoLogo className="h-16 w-auto" />
      </div>
      <SidebarNav role={role} permissions={permissions} />
    </div>
  );
};

export default Sidebar;
