import { baseLayout } from "./layout";

interface PasswordResetTemplateOptions {
  name: string;
  resetLink: string;
}

export function passwordResetTemplate({ name, resetLink }: PasswordResetTemplateOptions) {
  const content = `
    <h1>Recuperação de Senha</h1>
    <p>Olá, ${name}!</p>
    <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Kipo</strong>.</p>
    <p>Não se preocupe, é algo comum! Clique no botão abaixo para escolher uma nova senha segura. Este link é válido por <strong>1 hora</strong>.</p>
    
    <div style="text-align: center;">
      <a href="${resetLink}" class="button">Redefinir Minha Senha</a>
    </div>

    <p style="font-size: 14px; text-align: center; margin-top: 24px;">
      Se você não solicitou a redefinição, apenas ignore este e-mail. Sua senha atual permanecerá segura.
    </p>

    <hr />
    <p style="font-size: 11px; color: #94a3b8; text-align: center;">
      Por razões de segurança, este link só funcionará uma vez e expirará em breve.
    </p>
  `;

  return baseLayout({ 
    content, 
    previewText: "Recupere o acesso à sua conta no Kipo." 
  });
}
