import { getUserProfile } from "@/app/_data-access/user/get-user-profile";
import { Badge } from "./ui/badge";
import Link from "next/link";

export const SidebarUserProfile = async () => {
  const profile = await getUserProfile();

  if (!profile || !profile.name) return null;

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="px-3 py-4">
      <Link
        href="/profile"
        className="group flex items-center gap-3 rounded-xl border border-transparent p-2 transition-all duration-300 hover:border-slate-100 hover:bg-slate-50"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary shadow-sm ring-2 ring-white transition-all duration-300 group-hover:bg-primary group-hover:text-white">
          {initials}
        </div>

        <div className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-black leading-tight text-slate-800 transition-colors group-hover:text-primary">
            {profile.name}
          </span>
          <div className="mt-0.5 flex items-center gap-2">
            <Badge
              variant="outline"
              className="h-4 border-slate-200 bg-white px-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400"
            >
              {profile.role === "OWNER"
                ? "Proprietário"
                : profile.role === "ADMIN"
                  ? "Admin"
                  : "Equipe"}
            </Badge>
          </div>
        </div>
      </Link>
    </div>
  );
};
