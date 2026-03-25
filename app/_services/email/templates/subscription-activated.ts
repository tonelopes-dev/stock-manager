import { baseLayout } from "./layout";

interface SubscriptionActivatedTemplateOptions {
  name: string;
  companyName: string;
  expiryDateFormatted: string;
}

export function subscriptionActivatedTemplate({ name, companyName, expiryDateFormatted }: SubscriptionActivatedTemplateOptions) {
  const content = `
    <h1 style="color: #059669;">Pagamento Confirmado! ✅</h1>
    <p>Olá, ${name || "parceiro"}!</p>
    <p>Ótimas notícias! Sua assinatura <strong>Kipo PRO</strong> para a empresa <strong>${companyName}</strong> foi ativada com sucesso.</p>
    
    <div class="highlight-box">
        <h2 style="margin-top: 0; color: #7c3aed;">PRO Plan Ativo ✨</h2>
        <p style="margin-bottom: 0; font-size: 14px;">Seu acesso premium agora é válido até <strong>${expiryDateFormatted}</strong>. Todas as funcionalidades premium foram liberadas no seu painel.</p>
    </div>

    <p><strong>Destaques do seu plano:</strong></p>
    <ul style="padding-left: 20px; margin: 16px 0; color: #475569;">
      <li style="margin-bottom: 8px;">Gestão completa de estoque e insumos.</li>
      <li style="margin-bottom: 8px;">Relatórios avançados de lucratividade.</li>
      <li style="margin-bottom: 8px;">Equipe e usuários ilimitados.</li>
      <li style="margin-bottom: 0;">Suporte prioritário via WhatsApp.</li>
    </ul>

    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/" class="button">Ir para o Dashboard</a>
    </div>

    <p style="margin-top: 32px;">Obrigado por confiar no Kipo para gerir o seu negócio!</p>
    <p><strong>Equipe Kipo</strong></p>
  `;

  return baseLayout({ 
    content, 
    previewText: "Assinatura PRO Ativada! Aproveite todos os recursos liberados." 
  });
}
