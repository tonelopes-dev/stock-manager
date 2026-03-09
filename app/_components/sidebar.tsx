import { getCurrentUserRole } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";
import { SidebarNav } from "./sidebar-nav";
import { SidebarUserProfile } from "./sidebar-user-profile";

const Sidebar = async () => {
  const role = await getCurrentUserRole();
  const isOwner = role === UserRole.OWNER;
  const isAdminOrOwner = role === UserRole.OWNER || role === UserRole.ADMIN;

  return (
    <div className="flex h-full w-56 flex-col border-r border-gray-200 bg-white">
      <SidebarUserProfile />
      <SidebarNav isOwner={isOwner} isAdminOrOwner={isAdminOrOwner} />
    </div>
  );
};

export default Sidebar;
