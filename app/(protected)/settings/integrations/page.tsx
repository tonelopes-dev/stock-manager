import Header, {
  HeaderLeft,
  HeaderSubtitle,
  HeaderTitle,
} from "@/app/_components/header";
import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { IfoodSettingsForm } from "./_components/ifood-settings-form";

export default async function IntegrationsPage() {
  const companyId = await getCurrentCompanyId();
  const company = await db.company.findUnique({
    where: { id: companyId! },
    select: {
      ifoodMerchantId: true,
      ifoodClientId: true,
      ifoodClientSecret: true,
      ifoodOrdersEnabled: true,
      ifoodAutoConfirm: true,
    },
  });

  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-background p-8">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Configurações</HeaderSubtitle>
          <HeaderTitle>Integrações</HeaderTitle>
        </HeaderLeft>
      </Header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground">iFood Delivery</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Conecte sua loja ao ecossistema do iFood para receber pedidos e sincronizar seu cardápio.
            </p>
            
            <div className="mt-8">
               <IfoodSettingsForm initialData={company} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <span className="text-xl">🚀</span>
            </div>
            <h4 className="mt-4 text-base font-semibold">Mais integrações em breve</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Estamos trabalhando para integrar com Rappi, WhatsApp e Marketplaces.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
