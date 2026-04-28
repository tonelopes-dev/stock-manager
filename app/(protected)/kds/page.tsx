import Header, {
  HeaderLeft,
  HeaderTitle,
  HeaderSubtitle,
} from "@/app/_components/header";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { getKDSOrders } from "@/app/_data-access/order/get-kds-orders";
import { KDSClient } from "./_components/kds-client";
import { redirect } from "next/navigation";

export default async function KDSPage() {
  const companyId = await getCurrentCompanyId();
  if (!companyId) redirect("/login");

  const initialOrders = await getKDSOrders(companyId);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted">
      <Header className="shrink-0 border-b border-border bg-background px-8 py-4">
        <HeaderLeft>
          <div className="flex flex-col">
            <HeaderSubtitle>Monitoramento de Cozinha</HeaderSubtitle>
            <div className="text-2xl font-black italic tracking-tighter">
              <HeaderTitle>
                KDS<span className="text-primary">.</span>
              </HeaderTitle>
            </div>
          </div>
        </HeaderLeft>
      </Header>

      <main className="flex-1 overflow-hidden">
        <KDSClient initialOrders={initialOrders} companyId={companyId} />
      </main>
    </div>
  );
}
