import { baseLayout } from "./layout";

interface PaymentFailedTemplateOptions {
  name: string;
  companyName: string;
}

export function paymentFailedTemplate({ name, companyName }: PaymentFailedTemplateOptions) {
  const content = `
    <h1 style="color: #e11d48;">Houve um problema com seu pagamento ⚠️</h1>
    <p>Olá, ${name || "parceiro"}!</p>
    <p>Notamos que houve um problema no processamento do pagamento da sua assinatura <strong>Kipo PRO</strong> para a empresa <strong>${companyName}</strong>.</p>
    
    <div class="highlight-box" style="border-left: 4px solid #fbbf24; background-color: #fffbeb;">
        <h2 style="margin-top: 0; color: #92400e;">Por que isso aconteceu?</h2>
        <p style="margin-bottom: 0; font-size: 14px; color: #92400e;">Geralmente isso ocorre por dados incorretos do cartão, limite insuficiente ou bloqueio preventivo do banco. Mas não se preocupe, seus dados estão seguros!</p>
    </div>

    <p><strong>Como regularizar agora:</strong></p>
    <p>Para evitar a interrupção do seu acesso e garantir que sua gestão não pare, você pode tentar o pagamento novamente usando outro cartão ou método.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/plans" class="button" style="background-color: #7c3aed;">Tentar Novamente agora</a>
    </div>

    <p style="font-size: 14px; color: #64748b;">Se você já realizou o pagamento via Boleto ou Pix nos últimos minutos, desconsidere este aviso, pois o sistema pode levar um curto tempo para processar.</p>

    <p style="margin-top: 32px;">Se precisar de ajuda, basta responder a este e-mail.</p>
    <p><strong>Equipe Kipo</strong></p>
  `;

  return baseLayout({ 
    content, 
    previewText: "Houve um problema com seu pagamento da assinatura Kipo PRO. Veja como resolver." 
  });
}
