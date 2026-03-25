import { baseLayout } from "./layout";

interface InvitationTemplateOptions {
  companyName: string;
  inviteLink: string;
}

export function invitationTemplate({ companyName, inviteLink }: InvitationTemplateOptions) {
  const content = `
    <h1>Convite para Colaboração</h1>
    <p>Olá!</p>
    <p>Você foi convidado para se juntar à equipe da empresa <strong>${companyName}</strong> no sistema de gestão Kipo.</p>
    <p>Ao aceitar este convite, você poderá colaborar na gestão de estoque, vendas e acompanhamento de metas da empresa.</p>
    
    <div style="text-align: center;">
      <a href="${inviteLink}" class="button">Aceitar Convite e Começar</a>
    </div>

    <p style="font-size: 14px; text-align: center; margin-top: 24px;">
      Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:<br/>
      <span style="word-break: break-all; color: #7c3aed;">${inviteLink}</span>
    </p>

    <hr />
    <p style="font-size: 12px; color: #94a3b8; text-align: center;">Se você não esperava por este convite, pode ignorar este e-mail com segurança.</p>
  `;

  return baseLayout({ 
    content, 
    previewText: `Você recebeu um convite para colaborar com ${companyName} no Kipo.` 
  });
}
