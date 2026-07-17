"use client";

import { Button } from "@/app/_components/ui/button";
import { UserRole } from "@prisma/client";
import { Menu } from "lucide-react";
import { useState } from "react";
import { MobileMenuSheet } from "./mobile-menu-sheet";

interface HeaderMobileMenuProps {
  role?: UserRole;
  permissions?: string[];
  userProfile?: React.ReactNode;
}

export const HeaderMobileMenu = ({ role = "MEMBER", permissions = [], userProfile }: HeaderMobileMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="md:hidden h-9 w-9 rounded-xl border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all shadow-sm"
        onClick={() => setIsMenuOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <MobileMenuSheet 
        isOpen={isMenuOpen} 
        onOpenChange={setIsMenuOpen} 
        role={role} 
        permissions={permissions} 
        userProfile={userProfile}
      />
    </>
  );
};
