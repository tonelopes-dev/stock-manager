import { notFound } from "next/navigation";
import { getMenuDataBySlug } from "@/app/_data-access/menu/get-menu-data";
import { PromotionsClient } from "./_components/promotions-client";

interface PromotionsPageProps {
  params: Promise<{
    companySlug: string;
  }>;
}

export default async function PromotionsPage({ params }: PromotionsPageProps) {
  const { companySlug } = await params;
  if (companySlug === "undefined") return notFound();
  
  const menuData = await getMenuDataBySlug(companySlug);

  if (!menuData) {
    return notFound();
  }

  // Extract all products with active promotions
  const promoProducts = menuData.categories
    .flatMap((cat) => cat.products)
    .filter((p) => p.promoActive && p.promoPrice !== null);

  return (
    <div className="min-h-screen bg-white">
      <PromotionsClient 
        companySlug={companySlug} 
        companyId={menuData.id}
        products={promoProducts} 
        companyName={menuData.companyName}
      />
    </div>
  );
}
