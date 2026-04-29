import { getCurrentUserRole } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";
import { SidebarNav } from "./sidebar-nav";
import { KipoLogo } from "./logo";

const Sidebar = async () => {
  const role = await getCurrentUserRole();
  const isOwner = role === UserRole.OWNER;
  const isAdminOrOwner = role === UserRole.OWNER || role === UserRole.ADMIN;

  return (
    <div className="group/sidebar flex h-full w-20 flex-col border-r border-border bg-background transition-all duration-300 ease-in-out hover:w-56">
      <div className="flex h-16 shrink-0 items-center justify-center border-b group-hover/sidebar:justify-start group-hover/sidebar:pl-6">
        <KipoLogo className="h-16 w-auto" />
      </div>
      <SidebarNav isOwner={isOwner} isAdminOrOwner={isAdminOrOwner} />
    </div>
  );
};

export default Sidebar;
