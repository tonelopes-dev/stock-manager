"use client";

import { LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "./ui/button";

const LogoutButton = () => {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Button
      variant="ghost"
      className="w-full justify-center px-0 gap-0 transition-all duration-300 text-destructive hover:bg-destructive/10 hover:text-destructive group-hover/sidebar:justify-start group-hover/sidebar:px-4 group-hover/sidebar:gap-3"
      onClick={handleLogout}
    >
      <LogOutIcon size={20} className="shrink-0" />
      <span className="w-0 overflow-hidden opacity-0 transition-all duration-300 group-hover/sidebar:w-auto group-hover/sidebar:opacity-100">
        Sair
      </span>
    </Button>
  );
};

export default LogoutButton;
