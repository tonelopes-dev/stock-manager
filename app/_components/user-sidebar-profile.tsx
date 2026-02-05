import { getUserProfile } from "@/app/_data-access/user/get-user-profile";
import { Badge } from "./ui/badge";
import Link from "next/link";

export const UserSidebarProfile = async () => {
  const profile = await getUserProfile();

  if (!profile || !profile.name) return null;

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link 
      href="/profile" 
      className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 mb-2 transition-colors hover:bg-slate-50 group"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs ring-2 ring-white shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
        {initials}
      </div>
      <div className="flex flex-col min-w-0 pr-2">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="truncate text-sm font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors">
            {profile.name}
          </span>
          <Badge 
            variant="outline" 
            className="h-4 px-1 text-[9px] font-black uppercase tracking-tighter bg-slate-50 border-slate-200 text-slate-500 whitespace-nowrap"
          >
            {profile.role === "OWNER" ? "Prorietário" : profile.role === "ADMIN" ? "Admin" : "Membro"}
          </Badge>
        </div>
        <span className="truncate text-xs text-slate-500 leading-tight">
          {profile.email}
        </span>
      </div>
    </Link>
  );
};
