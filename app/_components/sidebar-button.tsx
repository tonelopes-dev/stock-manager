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
      className={`w-full justify-center px-0 gap-0 transition-all duration-300 group-hover/sidebar:justify-start group-hover/sidebar:px-4 group-hover/sidebar:gap-3 
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