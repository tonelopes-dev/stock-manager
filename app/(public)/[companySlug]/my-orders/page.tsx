import { notFound } from "next/navigation";
import { getMenuDataBySlug } from "@/app/_data-access/menu/get-menu-data";
import { MyOrdersClient } from "./_components/my-orders-client";

interface MyOrdersPageProps {
  params: Promise<{
    companySlug: string;
  }>;
}

export default async function MyOrdersPage({ params }: MyOrdersPageProps) {
  const { companySlug } = await params;
  if (companySlug === "undefined") return notFound();
  const menuData = await getMenuDataBySlug(companySlug);

  if (!menuData) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-muted">
      <MyOrdersClient companyId={menuData.id} />
    </div>
  );
}
