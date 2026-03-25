import { notFound } from "next/navigation";
import { getMenuData } from "@/app/_data-access/menu/get-menu-data";
import { MenuClient } from "./_components/menu-client";

interface MenuPageProps {
  params: Promise<{
    companyId: string;
  }>;
}

export default async function MenuPage({ params }: MenuPageProps) {
  const { companyId } = await params;
  const menuData = await getMenuData(companyId);

  if (!menuData) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-muted">
      <MenuClient menuData={menuData} companyId={companyId} />
    </div>
  );
}
