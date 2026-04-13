import * as dotenv from 'dotenv';
import path from 'path';
import { sendEmail } from '../app/_services/email.service';
import { subscriptionActivatedTemplate, paymentFailedTemplate } from '../app/_services/email/templates';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testBillingEmails() {
  const targetEmail = process.env.RESEND_TEST_EMAIL || 'tonelopes.dev@gmail.com';
  console.log(`🚀 Iniciando Teste de Status de Pagamento para: ${targetEmail}\n`);

  const tests = [
    {
      id: 'approved',
      name: 'Status: APROVADO ✅',
      subject: 'Pagamento Confirmado! ✅ - Kipo PRO',
      template: () => subscriptionActivatedTemplate({
        name: 'Cliente Teste',
        companyName: 'Minha Empresa Ltda',
        expiryDateFormatted: '15/05/2026'
      })
    },
    {
      id: 'rejected',
      name: 'Status: RECUSADO ❌',
      subject: 'Problema com seu pagamento ⚠️ - Kipo',
      template: () => paymentFailedTemplate({
        name: 'Cliente Teste',
        companyName: 'Minha Empresa Ltda'
      })
    }
  ];

  for (const test of tests) {
    try {
      console.log(`📤 Testando Cenário: ${test.name}...`);
      const result = await sendEmail({
        to: targetEmail,
        subject: test.subject,
        html: test.template()
      });

      if (result?.success) {
        console.log(`✅ Sucesso! Cenário "${test.id}" enviado. ID: ${result.id}\n`);
      } else {
        console.error(`❌ Falha ao enviar cenário "${test.id}".\n`);
      }
    } catch (error) {
      console.error(`💥 Erro crítico no cenário "${test.id}":`, error);
    }
    
    // Delay to see the output clearly
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  console.log('✨ Testes de faturamento concluídos!');
  console.log(`👉 Verifique sua caixa de entrada para validar os layouts de Aprovado e Recusado.`);
}

testBillingEmails();
