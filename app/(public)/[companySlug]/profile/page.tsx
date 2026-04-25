import { notFound } from "next/navigation";
import { getMenuDataBySlug } from "@/app/_data-access/menu/get-menu-data";
import { ProfileClient } from "./_components/profile-client";

interface ProfilePageProps {
  params: Promise<{
    companySlug: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { companySlug } = await params;
  if (companySlug === "undefined") return notFound();
  
  const menuData = await getMenuDataBySlug(companySlug);

  if (!menuData) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <ProfileClient 
        companySlug={companySlug} 
        companyId={menuData.id}
        companyName={menuData.companyName}
      />
    </div>
  );
}
