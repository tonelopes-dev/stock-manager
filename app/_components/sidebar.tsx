import {
  BeakerIcon,
  CreditCardIcon,
  LayoutGridIcon,
  PackageIcon,
  ShoppingBasketIcon,
  UsersIcon,
  HistoryIcon,
  SettingsIcon,
} from "lucide-react";
import SidebarButton from "./sidebar-button";
import LogoutButton from "./logout-button";
import SubscriptionPanel from "./subscription-panel";
import { UserSidebarProfile } from "./user-sidebar-profile";
import { getCurrentUserRole } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";
import { getCompanyPlan } from "../_data-access/company/get-company-plan";


const Sidebar = async () => {
  const role = await getCurrentUserRole();
  const isOwner = role === UserRole.OWNER;
  const isAdminOrOwner = role === UserRole.OWNER || role === UserRole.ADMIN;
  const { subscriptionStatus, stripeCurrentPeriodEnd } = await getCompanyPlan();

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {/* USER PROFILE */}
      <UserSidebarProfile />

      {/* LOGO */}
      <div className="px-8 py-4">
        <h1 className="text-xl font-black tracking-tighter text-primary italic">
          STOCKY
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

        <SidebarButton href="/ingredients">
          <BeakerIcon size={20} />
          Insumos
        </SidebarButton>

        <SidebarButton href="/sales">
          <ShoppingBasketIcon size={20} />
          Vendas
        </SidebarButton>

        {isOwner && (
          <SidebarButton href="/plans">
            <CreditCardIcon size={20} />
            Assinatura
          </SidebarButton>
        )}

        <div className="my-2 border-t border-gray-100" />

        {isAdminOrOwner && (
          <SidebarButton href="/settings/team">
            <UsersIcon size={20} />
            Equipe
          </SidebarButton>
        )}

        {isOwner && (
          <SidebarButton href="/settings/company">
            <SettingsIcon size={20} />
            Empresa
          </SidebarButton>
        )}

        {isAdminOrOwner && (
          <SidebarButton href="/audit">
            <HistoryIcon size={20} />
            Auditoria
          </SidebarButton>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-4 p-4">
        {/* SUBSCRIPTION PANEL */}
        {isOwner && (
          <SubscriptionPanel
            status={subscriptionStatus}
            periodEnd={stripeCurrentPeriodEnd}
          />
        )}


        {/* LOGOUT */}
        <LogoutButton />
      </div>
    </div>
  );
};


export default Sidebar;