import {
  CreditCardIcon,
  LayoutGridIcon,
  PackageIcon,
  ShoppingBasketIcon,
} from "lucide-react";
import SidebarButton from "./sidebar-button";
import LogoutButton from "./logout-button";
import PlanUsageWidget from "./plan-usage-widget";

const Sidebar = () => {
  return (
    <div className="flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* LOGO */}
      <div className="px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          STOCKLY
        </h1>
      </div>
      {/* BOTÕES */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <SidebarButton href="/dashboard">
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

        <SidebarButton href="/plans">
          <CreditCardIcon size={20} />
          Planos
        </SidebarButton>
      </div>

      <div className="mt-auto flex flex-col gap-4 p-4">
        {/* USAGE WIDGET */}
        <PlanUsageWidget />

        {/* LOGOUT */}
        <LogoutButton />
      </div>
    </div>
  );
};

export default Sidebar;