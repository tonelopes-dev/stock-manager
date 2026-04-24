import { notFound } from "next/navigation";
import { getMenuDataBySlug } from "@/app/_data-access/menu/get-menu-data";
import { MenuClient } from "./_components/menu-client";
import { Metadata } from "next";

interface MenuPageProps {
  params: Promise<{
    companySlug: string;
  }>;
}

export async function generateMetadata({
  params,
}: MenuPageProps): Promise<Metadata> {
  const { companySlug } = await params;
  const menuData = await getMenuDataBySlug(companySlug);

  if (!menuData) {
    return {
      title: "Cardápio não encontrado | Kipo",
    };
  }

  return {
    title: `${menuData.companyName} | Cardápio Digital`,
    description: menuData.description || `Confira o cardápio de ${menuData.companyName} e peça online!`,
    openGraph: {
      title: menuData.companyName,
      description: menuData.description || "Faça seu pedido online de forma rápida e fácil.",
      images: menuData.logoUrl ? [menuData.logoUrl] : [],
      type: "website",
    },
  };
}

export default async function MenuPage({ params }: MenuPageProps) {
  const { companySlug } = await params;
  if (companySlug === "undefined") return notFound();
  const menuData = await getMenuDataBySlug(companySlug);

  if (!menuData) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-muted">
      <MenuClient menuData={menuData} companyId={menuData.id} tableNumber={null} />
    </div>
  );
}
