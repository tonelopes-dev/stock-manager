interface BaseLayoutOptions {
  content: string;
  previewText?: string;
}

export function baseLayout({ content, previewText }: BaseLayoutOptions) {
  // Permanent public URL for the logo hosted on Vercel Blob
  const logoUrl = "https://58cg9lz13mnjgex3.public.blob.vercel-storage.com/logomarca-logotipo.png?v=5";

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kipo</title>
      <style>
        body { font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #475569; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { padding: 40px 20px; text-align: center; background-color: #ffffff; }
        .content { padding: 0 40px 40px 40px; line-height: 1.6; font-size: 16px; }
        .footer { padding: 32px 20px; background-color: #f8fafc; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        .button { display: inline-block; padding: 14px 32px; background-color: #7c3aed; color: #ffffff !important; border-radius: 6px; text-decoration: none; font-weight: 700; margin: 24px 0; font-size: 16px; transition: all 0.2s; }
        .highlight-box { background-color: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; margin: 24px 0; }
        h1 { color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 16px; margin-top: 0; }
        h2 { color: #0f172a; font-size: 18px; font-weight: 700; margin-bottom: 12px; }
        hr { border: none; border-top: 1px solid #e2e8f0; margin: 32px 0; }
        p { margin: 16px 0; }
        .text-orange { color: #f97316; }
      </style>
    </head>
    <body>
      ${previewText ? `<div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; color: #ffffff; line-height: 1px;">${previewText}</div>` : ''}
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Kipo Logo" style="height: 32px; width: auto; display: inline-block;" />
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Kipo. Todos os direitos reservados.</p>
          <p>Este é um e-mail automático enviado pela plataforma Kipo.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
