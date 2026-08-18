import { getMenuDataBySlug } from "@/app/_data-access/menu/get-menu-data";
import { notFound } from "next/navigation";
import { MenuConfigProvider } from "./_context/menu-config-context";

interface CompanyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ companySlug: string }>;
}

export default async function CompanyLayout({
  children,
  params,
}: CompanyLayoutProps) {
  const { companySlug } = await params;
  if (companySlug === "undefined") return notFound();

  const menuData = await getMenuDataBySlug(companySlug);
  if (!menuData) {
    return notFound();
  }

  return (
    <MenuConfigProvider
      requireSelfieOnCheckout={menuData.requireSelfieOnCheckout}
      enableServiceTax={menuData.enableServiceTax}
    >
      {children}
    </MenuConfigProvider>
  );
}
