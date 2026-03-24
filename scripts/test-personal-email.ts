import * as dotenv from 'dotenv';
import path from 'path';
import { sendEmail } from '../app/_services/email.service';
import { passwordResetTemplate } from '../app/_services/email/templates';

// Carregar variáveis de ambiente do .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testPersonalEmail() {
  const personalEmail = 'tonelopes.dev@gmail.com';
  console.log(`🚀 Iniciando teste de envio de e-mail para ${personalEmail}...`);
  
  try {
    const result = await sendEmail({
      to: personalEmail,
      subject: 'Teste de Arquitetura de E-mail - Stockly',
      html: passwordResetTemplate({
        name: 'Tone',
        resetLink: 'https://stockly.usekipo.com.br/auth/reset-password?token=test-token',
      }),
    });

    if (result?.success) {
      console.log('✅ E-mail enviado com sucesso! ID:', result.id);
      console.log(`👉 Verifique sua caixa de entrada (e spam) em ${personalEmail}`);
    } else {
      console.error('❌ Falha ao enviar e-mail.');
    }
  } catch (error) {
    console.error('💥 Erro durante o teste:', error);
  }
}

testPersonalEmail();
