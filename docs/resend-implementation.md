# Guia de Implementação: Resend Email Service

Este guia fornece uma referência completa para implementar um serviço de envio de e-mails robusto utilizando o [Resend](https://resend.com), baseado nos padrões utilizados neste projeto.

---

## 1. Pré-Requisitos

Antes de começar a codificar, você precisará de:

1.  **Conta no Resend**: Crie uma conta em [resend.com](https://resend.com).
2.  **API Key**: Gere uma chave de API no dashboard do Resend.
3.  **Domínio Verificado**: Para produção, você **deve** verificar um domínio próprio. O Resend não permite o envio de e-mails de domínios públicos (como `@gmail.com`) através da API em ambientes de produção sem verificação prévia.

---

## 2. Instalação

Adicione a biblioteca do Resend ao seu projeto:

```bash
npm install resend
# ou
yarn add resend
# ou
pnpm add resend
```

---

## 3. Configuração de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Chave de API obtida no dashboard do Resend
RESEND_API_KEY=re_123456789...

# E-mail padrão de envio (Deve ser do seu domínio verificado)
RESEND_FROM_EMAIL=contato@seudominio.com

# Nome que aparecerá no campo "De" (Ex: "Suporte Empresa")
RESEND_FROM_NAME="Minha Aplicação"
```

---

## 4. Implementação do Serviço (`email.service.ts`)

O serviço abaixo encapsula a lógica de envio, tratamento de erros e uma camada de segurança para domínios públicos.

```typescript
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
    let fromEmail = process.env.RESEND_FROM_EMAIL || 'suporte@seudominio.com';
    const defaultFromName = process.env.RESEND_FROM_NAME || 'App Name';

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
      fromEmail = 'suporte@seudominio.com'; // O seu domínio verificado
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
```

---

## 5. Exemplos de Uso

### Envio de E-mail Simples
```typescript
await sendEmail({
  to: 'cliente@gmail.com',
  subject: 'Bem-vindo!',
  html: '<h1>Olá!</h1><p>Seja bem-vindo ao nosso sistema.</p>'
});
```

### Envio com Anexos
```typescript
await sendEmail({
  to: 'financeiro@empresa.com',
  subject: 'Sua Fatura',
  html: '<p>Segue anexo o boleto.</p>',
  attachments: [
    {
      filename: 'fatura.pdf',
      content: 'JVBERi0xLjQKJ...', // Base64 string
      type: 'application/pdf',
      disposition: 'attachment'
    }
  ]
});
```

---

## 6. Melhores Práticas Identificadas

1.  **Extract Reply-To**: Sempre que utilizar um sistema onde o e-mail parece vir de um usuário, use o seu domínio verificado no campo `from` e o e-mail do usuário no campo `reply_to`. Isso garante que as respostas cheguem à pessoa certa sem que o e-mail seja marcado como spam ou rejeitado pelo Resend.
2.  **HTML vs Text**: Sempre forneça uma versão `text` (mesmo que simplificada) para garantir que seu e-mail seja legível em todos os clientes e melhore sua pontuação de entregabilidade.
3.  **Ambiente de Teste**: Durante o desenvolvimento, o Resend oferece um domínio de testes (`onboarding@resend.dev`), mas ele só permite o envio para o seu próprio e-mail de cadastro.
4.  **Resiliência**: Envolva suas chamadas em blocos `try/catch` e registre os IDs de retorno para rastreamento futuro no dashboard do Resend.
