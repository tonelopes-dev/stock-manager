"use client";

import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import Link from "next/link";

interface SidebarButtonProps {
  children: React.ReactNode;
  href: string;
}

const SidebarButton = ({ href, children }: SidebarButtonProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Button
      variant="ghost"
      className={`w-full justify-start gap-3 rounded-xl transition-all duration-200 
        ${isActive 
          ? "bg-primary/10 text-primary font-bold hover:bg-orange-500/10 hover:text-primary" 
          : "text-foreground hover:bg-orange-500/10 hover:text-primary"
        }`}
      asChild
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
};

export default SidebarButton;