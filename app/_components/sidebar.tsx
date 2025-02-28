"use client";
import { LayoutDashboard, PackageIcon, ShoppingBag } from "lucide-react";

import { usePathname } from "next/navigation";
import SidebarButton from "./sidebar-button";

const Sidebar = () => {
  const pathname = usePathname();
  return (
    <div className="w-64 bg-white">
      {/* IMAGE */}
      <div className="px-8 py-6">
        <h1 className="text-2xl font-bold">STOCKLY</h1>
      </div>
      {/* BOTOES */}
      <div className="flex flex-col gap-2 p-2">
        <SidebarButton href="/">
          <LayoutDashboard size={20} />
          Dashboard
        </SidebarButton>

        <SidebarButton href="/products">
          <PackageIcon size={20} />
          Produtos
        </SidebarButton>

        <SidebarButton href="/sales">
          <ShoppingBag size={20} />
          Vendas
        </SidebarButton>
      </div>
    </div>
  );
};

export default Sidebar;
