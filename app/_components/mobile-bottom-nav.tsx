"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Flame } from "lucide-react";
import { cn } from "@/app/_lib/utils";

export const MobileBottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Vendas",
      href: "/sales",
      icon: ShoppingBag,
    },
    {
      name: "KDS",
      href: "/kds",
      icon: Flame,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-around border-t border-border bg-background/95 backdrop-blur-md md:hidden">
      {navItems.map((item) => {
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
              <Icon size={18} className={isActive ? "scale-110 transition-transform" : ""} />
            </div>
            <span className="tracking-wider uppercase text-[10px]">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};
