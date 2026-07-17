"use client";

import { LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "./ui/button";

interface LogoutButtonProps {
  showText?: boolean;
}

const LogoutButton = ({ showText = false }: LogoutButtonProps) => {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Button
      variant="ghost"
      className={`w-full transition-all duration-300 text-destructive hover:bg-destructive/10 hover:text-destructive ${
        showText 
          ? "justify-start px-4 gap-3" 
          : "justify-center px-0 gap-0 group-hover/sidebar:justify-start group-hover/sidebar:px-4 group-hover/sidebar:gap-3"
      }`}
      onClick={handleLogout}
    >
      <LogOutIcon size={20} className="shrink-0" />
      <span 
        className={`transition-all duration-300 ${
          showText 
            ? "w-auto opacity-100" 
            : "w-0 overflow-hidden opacity-0 group-hover/sidebar:w-auto group-hover/sidebar:opacity-100"
        }`}
      >
        Sair
      </span>
    </Button>
  );
};

export default LogoutButton;
