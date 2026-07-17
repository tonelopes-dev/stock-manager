"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/app/_lib/utils";
import { NAVIGATION_ITEMS } from "@/app/_config/navigation";
import { hasCapability } from "@/app/_lib/permissions";
import { UserRole } from "@prisma/client";

interface MobileBottomNavProps {
  role: UserRole;
  permissions: string[];
}

export const MobileBottomNav = ({ role = "MEMBER" as UserRole, permissions = [] }: MobileBottomNavProps) => {
  const pathname = usePathname();

  // Selecionar os 4 itens de acesso rápido definidos no plano
  const quickAccessPaths = ["/sales", "/kds", "/cardapio", "/dashboard"];
  const quickAccessItems = quickAccessPaths.map(path => 
    NAVIGATION_ITEMS.find(item => item.href === path)
  ).filter(Boolean); // Filtra undefined caso a rota seja removida futuramente

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 w-full items-center justify-around border-t border-border bg-background/95 backdrop-blur-md md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {quickAccessItems.map((item) => {
          if (!item) return null;
          
          // RBAC na Barra Fixa: Renderiza fallback vazio p/ manter espaçamento
          if (item.requiredCapability && !hasCapability(permissions, role, item.requiredCapability)) {
            return <div key={`empty-${item.href}`} className="flex-1" />;
          }

          const isActive = pathname?.startsWith(item.href) || false;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-bold transition-all active:scale-95",
                isActive
                  ? "text-primary font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                  isActive ? "bg-primary/10 text-primary shadow-sm" : "bg-transparent"
                )}
              >
                <Icon size={20} className={isActive ? "scale-110 transition-transform" : ""} />
              </div>
              <span className="tracking-wider uppercase text-[9px] truncate w-full text-center px-1">
                {item.label}
              </span>
            </Link>
          );
        })}

      </nav>
    </>
  );
};
