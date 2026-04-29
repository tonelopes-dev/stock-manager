import Header, {
  HeaderLeft,
  HeaderTitle,
  HeaderSubtitle,
} from "@/app/_components/header";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { getKDSOrders } from "@/app/_data-access/order/get-kds-orders";
import { getEnvironments } from "@/app/_data-access/product/get-environments";
import { KDSClient } from "./_components/kds-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function KDSPage() {

  const companyId = await getCurrentCompanyId();
  if (!companyId) redirect("/login");

  const [initialOrders, environments] = await Promise.all([
    getKDSOrders(companyId),
    getEnvironments(),
  ]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted">
      <main className="flex-1 overflow-hidden">
        <KDSClient 
          initialOrders={initialOrders} 
          companyId={companyId} 
          environments={environments}
        />
      </main>
    </div>
  );
}
