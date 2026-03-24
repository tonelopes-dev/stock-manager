import { baseLayout } from "./layout";

interface SubscriptionActivatedTemplateOptions {
  name: string;
  companyName: string;
  expiryDateFormatted: string;
}

export function subscriptionActivatedTemplate({ name, companyName, expiryDateFormatted }: SubscriptionActivatedTemplateOptions) {
  const content = `
    <h1 style="color: #059669; margin-bottom: 8px;">Pagamento Confirmado! ✅</h1>
    <p>Olá, ${name || "parceiro"}!</p>
    <p>Ótimas notícias! Sua assinatura <strong>Stockly PRO</strong> para a empresa <strong>${companyName}</strong> foi ativada com sucesso.</p>
    
    <div class="highlight-box" style="background-color: #ecfdf5; border: 1px solid #d1fae5;">
        <p style="margin-top: 0; color: #064e3b;"><strong>PRO Plan Ativo ✨</strong></p>
        <p style="margin-bottom: 0; font-size: 14px; color: #065f46;">Seu acesso premium agora é válido até <strong>${expiryDateFormatted}</strong>. Todas as funcionalidades premium foram liberadas.</p>
    </div>

    <p><strong>Recursos agora disponíveis:</strong></p>
    <ul style="padding-left: 20px; margin: 16px 0;">
      <li style="margin-bottom: 8px;">Gestão completa de estoque e insumos.</li>
      <li style="margin-bottom: 8px;">Relatórios avançados de lucratividade.</li>
      <li style="margin-bottom: 8px;">Equipe e usuários ilimitados.</li>
      <li style="margin-bottom: 0;">Suporte prioritário via chat/WhatsApp.</li>
    </ul>

    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/" class="button" style="background-color: #059669;">Ir para o Dashboard</a>
    </div>

    <p style="margin-top: 32px;">Obrigado por confiar no Stockly para gerir o seu negócio!</p>
    <p>Equipe Stockly</p>
  `;

  return baseLayout({ 
    content, 
    previewText: "Assinatura PRO Ativada! Aproveite todos os recursos liberados." 
  });
}
