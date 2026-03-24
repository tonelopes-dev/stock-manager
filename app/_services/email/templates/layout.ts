interface BaseLayoutOptions {
  content: string;
  previewText?: string;
}

export function baseLayout({ content, previewText }: BaseLayoutOptions) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kipo</title>
      <style>
        body { font-family: sans-serif; margin: 0; padding: 0; background-color: #f9fafb; color: #111827; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
        .header { padding: 32px 20px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #f3f4f6; }
        .logo { font-size: 24px; font-weight: 800; color: #2563eb; text-decoration: none; }
        .content { padding: 40px 30px; line-height: 1.6; }
        .footer { padding: 32px 20px; background-color: #f9fafb; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff !important; border-radius: 8px; text-decoration: none; font-weight: 700; margin: 20px 0; }
        .highlight-box { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0; }
        hr { border: none; border-top: 1px solid #f3f4f6; margin: 32px 0; }
        p { margin: 16px 0; }
      </style>
    </head>
    <body>
      ${previewText ? `<div style="display: none; max-height: 0px; overflow: hidden;">${previewText}</div>` : ''}
      <div class="container">
        <div class="header">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || '#'}" class="logo">📦 Kipo</a>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Kipo. Todos os direitos reservados.</p>
          <p>Este é um e-mail automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
