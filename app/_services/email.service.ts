import { Resend } from 'resend';

// Interfaces para tipagem robusta
export interface EmailAttachment {
  content: string; // Conteúdo em base64
  filename: string;
  type: string;
  disposition: 'attachment' | 'inline';
}

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  fromName?: string;
  attachments?: EmailAttachment[];
}

/**
 * Serviço centralizado de e-mail
 */
export async function sendEmail(options: EmailOptions) {
  const { to, subject, html, text, replyTo, fromName, attachments } = options;
  
  // 1. Validação básica de formato de e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailToValidate = to.includes('<') ? to.split('<')[1].split('>')[0] : to;
  
  if (!emailRegex.test(emailToValidate)) {
    throw new Error(`Endereço de e-mail inválido: ${to}`);
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ RESEND_API_KEY não configurada.');
    return;
  }

  try {
    const resend = new Resend(apiKey);

    // Configurações de remetente
    let fromEmail = process.env.RESEND_FROM_EMAIL || 'contato@usekipo.com.br';
    const defaultFromName = process.env.RESEND_FROM_NAME || 'Stockly';

    /**
     * 🛡️ Lógica de Segurança contra Bloqueio de Domínio Público
     * O Resend rejeita (Erro 403) envios onde o 'from' é um domínio público
     * que você não controla (ex: usuário tentando enviar como seu próprio gmail).
     */
    const publicDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
    const emailDomain = fromEmail.split('@')[1]?.toLowerCase();
    
    let finalReplyTo = replyTo;

    if (publicDomains.includes(emailDomain)) {
      // Se detectarmos um domínio público, forçamos o envio pelo domínio oficial
      // e colocamos o e-mail original no 'replyTo'.
      if (!finalReplyTo) finalReplyTo = fromEmail;
      fromEmail = 'contato@usekipo.com.br'; // O seu domínio verificado
    }

    const displayName = fromName || defaultFromName;
    const from = `${displayName} <${fromEmail}>`;

    // 2. Construção do Payload
    const resendPayload: any = {
      from,
      to: [to],
      subject,
      html,
      // Fallback de texto puro (importante para acessibilidade e filtros anti-spam)
      text: text || (html ? html.replace(/<[^>]*>/g, '') : ''),
    };

    if (finalReplyTo) {
      resendPayload.reply_to = finalReplyTo;
    }

    // 3. Tratamento de Anexos
    if (attachments && attachments.length > 0) {
      resendPayload.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.type,
      }));
    }

    // 4. Envio propriamente dito
    const { data, error } = await resend.emails.send(resendPayload);

    if (error) {
      throw new Error(`Falha no Resend: ${error.message}`);
    }

    return { success: true, id: data?.id };

  } catch (error) {
    console.error('❌ Erro no serviço de e-mail:', error);
    throw error;
  }
}
