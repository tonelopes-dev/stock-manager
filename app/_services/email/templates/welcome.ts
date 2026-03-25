import { baseLayout } from "./layout";

interface WelcomeTemplateOptions {
  name: string;
}

export function welcomeTemplate({ name }: WelcomeTemplateOptions) {
  const content = `
    <h1>Olá, ${name}! 🚀</h1>
    <p>Seja muito bem-vindo ao <strong>Kipo</strong>, o seu sistema de gestão de estoque e vendas inteligente.</p>
    <p>Estamos entusiasmados por você ter escolhido o Kipo para ajudar a impulsionar o seu negócio.</p>
    
    <div class="highlight-box">
        <h2 style="margin-top: 0;">Seu período de teste PRO já começou! ✨</h2>
        <p style="margin-bottom: 0; font-size: 14px;">Aproveite acesso total a todas as funcionalidades premium para organizar seu estoque e simplificar suas vendas.</p>
    </div>

    <p><strong>Por onde começar:</strong></p>
    <ul style="padding-left: 20px; margin: 16px 0; color: #475569;">
      <li style="margin-bottom: 8px;">Cadastre seus primeiros produtos ou insumos.</li>
      <li style="margin-bottom: 8px;">Configure seus ambientes e categorias.</li>
      <li style="margin-bottom: 0;">Convite sua equipe para colaborar em tempo real.</li>
    </ul>

    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" class="button">Acessar Meu Painel</a>
    </div>

    <p style="margin-top: 32px;">Estamos à disposição para ajudar no que for necessário.</p>
    <p><strong>Equipe de Sucesso do Cliente Kipo</strong></p>
  `;

  return baseLayout({ 
    content, 
    previewText: "Bem-vindo ao Kipo! Seu acesso PRO já está liberado." 
  });
}
