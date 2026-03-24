import { baseLayout } from "./layout";

interface PasswordResetTemplateOptions {
  name: string;
  resetLink: string;
}

export function passwordResetTemplate({ name, resetLink }: PasswordResetTemplateOptions) {
  const content = `
    <h1 style="color: #111827; margin-bottom: 8px;">Recuperação de Senha</h1>
    <p>Olá, ${name}!</p>
    <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Stockly</strong>.</p>
    <p>Não se preocupe, é algo comum! Clique no botão abaixo para escolher uma nova senha segura. Este link é válido por <strong>1 hora</strong>.</p>
    
    <div style="text-align: center;">
      <a href="${resetLink}" class="button">Redefinir Minha Senha</a>
    </div>

    <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 24px;">
      Se você não solicitou a redefinição, apenas ignore este e-mail. Sua senha atual permanecerá segura.
    </p>

    <hr />
    <p style="font-size: 11px; color: #9ca3af; text-align: center;">
      Por razões de segurança, este link só funcionará uma vez e expirará em breve.
    </p>
  `;

  return baseLayout({ 
    content, 
    previewText: "Recupere o acesso à sua conta no Stockly." 
  });
}
