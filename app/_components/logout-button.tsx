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
      className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={handleLogout}
    >
      <LogOutIcon size={20} />
      Sair
    </Button>
  );
};

export default LogoutButton;
