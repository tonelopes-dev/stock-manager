import { getUserProfile } from "@/app/_data-access/user/get-user-profile";
import { Badge } from "./ui/badge";
import Link from "next/link";

export const HeaderUserProfile = async () => {
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
      className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shadow-sm ring-2 ring-white transition-colors group-hover:bg-primary group-hover:text-background">
        {initials}
      </div>
      <div className="hidden flex-col sm:flex">
        <span className="text-xs font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
          {profile.name.split(" ")[0]}
        </span>
        <Badge
          variant="outline"
          className="h-3.5 w-fit border-border px-1 text-[8px] font-black uppercase tracking-tighter text-muted-foreground"
        >
          {profile.role === "OWNER"
            ? "Proprietário"
            : profile.role === "ADMIN"
              ? "Administrador"
              : "Equipe"}
        </Badge>
      </div>
    </Link>
  );
};
