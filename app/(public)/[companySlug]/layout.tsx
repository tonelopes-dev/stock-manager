import { notFound } from "next/navigation";
import { getMenuDataBySlug } from "@/app/_data-access/menu/get-menu-data";
import { MenuConfigProvider } from "./_components/menu-config-context";

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
  console.log(menuData);
  console.log(menuData?.categories);
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
