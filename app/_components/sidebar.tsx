"use client";

import {
  LayoutGridIcon,
  LogOutIcon,
  PackageIcon,
  ShoppingBasketIcon,
} from "lucide-react";
import SidebarButton from "./sidebar-button";
import { signOut } from "next-auth/react";
import { Button } from "./ui/button";

const Sidebar = () => {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="flex w-64 flex-col bg-white">
      {/* IMAGEM */}
      <div className="px-8 py-6">
        <h1 className="text-2xl font-bold">STOCKLY</h1>
      </div>
      {/* BOTÕES */}
      <div className="flex flex-1 flex-col gap-2 p-2">
        <SidebarButton href="/">
          <LayoutGridIcon size={20} />
          Dashboard
        </SidebarButton>

        <SidebarButton href="/products">
          <PackageIcon size={20} />
          Produtos
        </SidebarButton>

        <SidebarButton href="/sales">
          <ShoppingBasketIcon size={20} />
          Vendas
        </SidebarButton>
      </div>
      {/* LOGOUT */}
      <div className="p-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={handleLogout}
        >
          <LogOutIcon size={20} />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;