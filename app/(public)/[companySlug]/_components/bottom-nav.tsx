"use client";

import { Home, Tag, Receipt, User } from "lucide-react";
import { cn } from "@/app/_lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomNavProps {
  companySlug: string;
}

export function BottomNav({ companySlug }: BottomNavProps) {
  const pathname = usePathname();

  const tabs = [
    { 
      id: "home", 
      label: "Início", 
      icon: Home,
      href: `/${companySlug}`
    },
    { 
      id: "promotions", 
      label: "Promoções", 
      icon: Tag,
      href: `/${companySlug}/promotions` // Not implemented yet
    },
    { 
      id: "orders", 
      label: "Pedidos", 
      icon: Receipt,
      href: `/${companySlug}/my-orders`
    },
    { 
      id: "profile", 
      label: "Perfil", 
      icon: User,
      href: `/${companySlug}/profile`
    },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full items-center border-t border-gray-100 bg-white/95 pb-safe backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-md items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || (tab.id === "home" && pathname === `/${companySlug}`);

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95",
                isActive ? "text-primary" : "text-gray-400"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-12 items-center justify-center rounded-2xl transition-all",
                  isActive ? "bg-primary/10" : "bg-transparent"
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    "transition-all",
                    isActive ? "fill-primary/20 stroke-[2.5px]" : "stroke-[2px]"
                  )}
                />
              </div>
              <span className="text-[10px] font-medium lowercase leading-none">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
