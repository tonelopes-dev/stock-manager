"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/app/_components/ui/sheet";
import { NAVIGATION_ITEMS } from "@/app/_config/navigation";
import { hasCapability } from "@/app/_lib/permissions";
import { cn } from "@/app/_lib/utils";
import { useAppMode } from "@/app/_providers/app-mode-provider";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./logout-button";

interface MobileMenuSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  role: UserRole;
  permissions: string[];
  userProfile?: React.ReactNode;
}

export const MobileMenuSheet = ({
  isOpen,
  onOpenChange,
  role = "MEMBER" as UserRole,
  permissions = [],
  userProfile,
}: MobileMenuSheetProps) => {
  const { mode } = useAppMode();
  const pathname = usePathname();

  // Reutilizando a exata mesma lógica de filtro do Desktop
  const coreItems = NAVIGATION_ITEMS.filter((item) => {
    if (item.isSensitive) return false;
    
    const matchMode = item.mode === "both" || item.mode === mode;
    if (!matchMode) return false;
    
    if (item.requiredCapability && !hasCapability(permissions, role, item.requiredCapability)) {
      return false;
    }
    
    return true;
  });

  const sensitiveItems = NAVIGATION_ITEMS.filter((item) => {
    if (!item.isSensitive) return false;
    
    if (item.requiredCapability && !hasCapability(permissions, role, item.requiredCapability)) {
      return false;
    }
    
    return true;
  });

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-3/4 max-w-sm flex-col p-0 border-l">
        <SheetHeader className="p-4 text-left border-b border-border bg-muted/30">
          <SheetTitle className="text-sm font-black uppercase tracking-tight text-primary">
            Menu Principal
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pb-6">
          {userProfile && (
            <div 
              className="border-b border-border px-2 py-3"
              onClick={() => onOpenChange(false)}
            >
              {userProfile}
            </div>
          )}

          <div className="flex flex-col p-2 gap-1">
            <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {mode === "gestao" ? "Gestão" : "Operação"}
            </p>
            
            {coreItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition-all active:scale-95",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon size={18} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {sensitiveItems.length > 0 && (
            <>
              <div className="my-2 border-t border-border mx-4" />
              <div className="flex flex-col p-2 gap-1">
                <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Configurações
                </p>
                {sensitiveItems.map((item) => {
                  const isActive = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition-all active:scale-95",
                        isActive 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon size={18} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Rodapé do Menu */}
        <div className="mt-auto border-t border-border p-4 bg-muted/30">
          <LogoutButton showText={true} />
        </div>
      </SheetContent>
    </Sheet>
  );
};
