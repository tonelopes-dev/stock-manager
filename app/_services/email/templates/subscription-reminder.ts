import { baseLayout } from "./layout";

interface SubscriptionReminderTemplateOptions {
  name: string;
  companyName: string;
  daysLeft: number;
  expiryDateFormatted: string;
}

export function subscriptionReminderTemplate({ name, companyName, daysLeft, expiryDateFormatted }: SubscriptionReminderTemplateOptions) {
  const isToday = daysLeft === 0;
  
  const title = isToday
    ? "⚠️ Sua assinatura vence hoje!"
    : `🔔 Lembrete: ${daysLeft} dias para o vencimento`;

  const message = isToday
    ? `Sua assinatura para a empresa <strong>${companyName}</strong> vence hoje. Para evitar interrupção no serviço, realize a renovação agora.`
    : `Gostaríamos de lembrar que sua assinatura para a empresa <strong>${companyName}</strong> vence em <strong>${daysLeft} dias</strong> (${expiryDateFormatted}).`;

  const content = `
    <h1 style="color: ${isToday ? '#f97316' : '#7c3aed'};">${title}</h1>
    <p>Olá, ${name || "parceiro"}!</p>
    <p>${message}</p>
    
    <div class="highlight-box">
        <h2 style="margin-top: 0;">Por que renovar seu Kipo PRO? ✨</h2>
        <p style="margin-bottom: 0; font-size: 14px;">Mantenha seu estoque sincronizado, acesse relatórios de vendas em tempo real e colabore com sua equipe sem interrupções.</p>
    </div>

    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/checkout" class="button">Renovar Assinatura Agora</a>
    </div>

    <hr />
    <p style="font-size: 12px; color: #94a3b8; text-align: center;">
      Se você já realizou o pagamento via boleto, por favor ignore este e-mail. O processamento pode levar até 2 dias úteis.
    </p>
    <p style="font-size: 12px; color: #94a3b8; text-align: center; font-weight: bold;">Equipe Kipo</p>
  `;

  return baseLayout({ 
    content, 
    previewText: isToday ? "Urgente: Renove sua assinatura Kipo hoje!" : `Sua assinatura Kipo vence em ${daysLeft} dias.`
  });
}
