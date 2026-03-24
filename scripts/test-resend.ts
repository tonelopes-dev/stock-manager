import * as dotenv from 'dotenv';
import path from 'path';
import { sendEmail } from '../app/_services/email.service';

// Carregar variáveis de ambiente do .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testEmail() {
  console.log('🚀 Iniciando teste de envio de e-mail...');
  
  try {
    const result = await sendEmail({
      to: 'contato@usekipo.com.br',
      subject: 'Teste de Integração Resend - Stockly',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h1 style="color: #2563eb;">Conexão Bem-Sucedida!</h1>
          <p>Este é um e-mail de teste enviado para validar a configuração do Resend no projeto <strong>Stockly</strong>.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Enviado via Resend API.</p>
        </div>
      `,
    });

    if (result?.success) {
      console.log('✅ E-mail enviado com sucesso! ID:', result.id);
    } else {
      console.error('❌ Falha ao enviar e-mail.');
    }
  } catch (error) {
    console.error('💥 Erro durante o teste:', error);
  }
}

testEmail();
