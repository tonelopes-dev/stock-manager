import { ShieldAlertIcon } from "lucide-react";
import { BillingActions } from "./_components/billing-actions";

export const dynamic = "force-dynamic";

const BillingRequiredPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Superior Banner */}
        <div className="flex flex-col items-center bg-red-50 p-8 text-center">
          <div className="mb-4 rounded-full bg-red-100 p-4">
            <ShieldAlertIcon className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Assinatura Necessária
          </h1>
          <p className="max-w-xs text-gray-500">
            Para continuar utilizando o sistema, sua assinatura precisa estar ativa e com o pagamento em dia.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8">
          <div className="mb-8 space-y-4 text-center text-sm text-gray-600">
            <p>
              Sua conta está atualmente bloqueada para novas operações porque sua
              assinatura expirou, foi cancelada ou possui pagamentos pendentes.
            </p>
            <div className="rounded-lg bg-gray-50 p-4 text-left">
              <h3 className="mb-2 font-semibold text-gray-900">
                O que acontece agora?
              </h3>
              <ul className="list-inside list-disc space-y-1">
                <li>Acesso ao dashboard bloqueado</li>
                <li>Operações de estoque suspensas</li>
                <li>Geração de relatórios desativada</li>
              </ul>
            </div>
            <p className="font-medium text-gray-900">
              Regularize sua situação para restaurar o acesso imediato.
            </p>
          </div>

          <BillingActions />

          <p className="mt-8 text-center text-xs text-gray-400">
            Dúvidas? Entre em contato com nosso suporte técnico.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BillingRequiredPage;
