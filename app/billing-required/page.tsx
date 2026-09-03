import { auth } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import { ShieldAlertIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { BillingActions } from "./_components/billing-actions";

export const dynamic = "force-dynamic";

const BillingRequiredPage = async () => {
  const session = await auth();
  const now = new Date();

  // [DEBUG] Log full session state on every visit to /billing-required
  console.log("[BillingRequired] ===== DEBUG =====");
  console.log("[BillingRequired] session.user:", JSON.stringify({
    id: session?.user?.id,
    companyId: session?.user?.companyId,
    subscriptionStatus: session?.user?.subscriptionStatus,
    expiresAt: session?.user?.expiresAt,
    role: session?.user?.role,
  }, null, 2));
  console.log("[BillingRequired] server now:", now.toISOString());

  if (session?.user?.companyId) {
    const company = await db.company.findUnique({
      where: { id: session.user.companyId },
      select: { expiresAt: true, subscriptionStatus: true, lastPaymentId: true, plan: true },
    });

    // [DEBUG] Log raw DB state
    console.log("[BillingRequired] DB company:", JSON.stringify({
      subscriptionStatus: company?.subscriptionStatus,
      expiresAt: company?.expiresAt?.toISOString(),
      lastPaymentId: company?.lastPaymentId,
      plan: company?.plan,
      expiresAtGtNow: company?.expiresAt ? company.expiresAt > now : false,
    }, null, 2));

    const isActive = company?.subscriptionStatus === "ACTIVE" &&
                     company?.expiresAt &&
                     company.expiresAt > now;

    const isTrialing = company?.subscriptionStatus === "TRIALING" &&
                       company?.expiresAt &&
                       company.expiresAt > now;

    console.log("[BillingRequired] isActive:", isActive, "| isTrialing:", isTrialing);

    if (isActive || isTrialing) {
      console.log("[BillingRequired] ✅ Subscription valid — redirecting to /sales");
      redirect("/sales");
    } else {
      console.log("[BillingRequired] ❌ Subscription NOT valid — staying on billing-required");
    }
  } else {
    console.log("[BillingRequired] ⚠️ No companyId in session — user may not be logged in");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-6">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-background shadow-xl">
        {/* Superior Banner */}
        <div className="flex flex-col items-center bg-destructive/10 p-8 text-center">
          <div className="mb-4 rounded-full bg-destructive/10 p-4">
            <ShieldAlertIcon className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            Assinatura Necessária
          </h1>
          <p className="max-w-xs text-muted-foreground">
            Para continuar utilizando o sistema, sua assinatura precisa estar ativa e com o pagamento em dia.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8">
          <div className="mb-8 space-y-4 text-center text-sm text-muted-foreground">
            <p>
              Sua conta está atualmente bloqueada para novas operações porque sua
              assinatura expirou, foi cancelada ou possui pagamentos pendentes.
            </p>
            <div className="rounded-lg bg-muted p-4 text-left">
              <h3 className="mb-2 font-semibold text-foreground">
                O que acontece agora?
              </h3>
              <ul className="list-inside list-disc space-y-1">
                <li>Acesso ao dashboard bloqueado</li>
                <li>Operações de estoque suspensas</li>
                <li>Geração de relatórios desativada</li>
              </ul>
            </div>
            <p className="font-medium text-foreground">
              Regularize sua situação para restaurar o acesso imediato.
            </p>
          </div>

          <BillingActions />

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Dúvidas? Entre em contato com nosso suporte técnico.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BillingRequiredPage;
