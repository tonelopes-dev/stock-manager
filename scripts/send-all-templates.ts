import * as dotenv from 'dotenv';
import path from 'path';
import { sendEmail } from '../app/_services/email.service';
import * as templates from '../app/_services/email/templates';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function sendAllTemplates() {
  const targetEmail = 'tonelopes.dev@gmail.com';
  console.log(`🚀 Preparando envio de todos os modelos para: ${targetEmail}\n`);

  const testBatch = [
    {
      name: 'Boas-vindas',
      template: () => templates.welcomeTemplate({ name: 'Tone Lopes' }),
      subject: 'Bem-vindo ao Kipo! 🚀'
    },
    {
      name: 'Redefinição de Senha',
      template: () => templates.passwordResetTemplate({ 
        name: 'Tone', 
        resetLink: 'https://usekipo.com.br/auth/reset-password?token=sample-token' 
      }),
      subject: 'Redefinição de Senha - Kipo'
    },
    {
      name: 'Convite de Equipe',
      template: () => templates.invitationTemplate({ 
        companyName: 'Bistrô do Tone', 
        inviteLink: 'https://usekipo.com.br/register?invite=sample-invite' 
      }),
      subject: 'Você foi convidado para o Bistrô do Tone no Kipo'
    },
    {
      name: 'Lembrete de Vencimento (Faltam 3 dias)',
      template: () => templates.subscriptionReminderTemplate({
        name: 'Tone',
        companyName: 'Bistrô do Tone',
        daysLeft: 3,
        expiryDateFormatted: '27/03/2026'
      }),
      subject: '🔔 Lembrete: 3 dias para o vencimento - Kipo'
    },
    {
      name: 'Lembrete de Vencimento (Vence Hoje)',
      template: () => templates.subscriptionReminderTemplate({
        name: 'Tone',
        companyName: 'Bistrô do Tone',
        daysLeft: 0,
        expiryDateFormatted: '24/03/2026'
      }),
      subject: '⚠️ Sua assinatura Kipo vence hoje!'
    },
    {
      name: 'Assinatura Ativada',
      template: () => templates.subscriptionActivatedTemplate({
        name: 'Tone Lopes',
        companyName: 'Bistrô do Tone',
        expiryDateFormatted: '24/04/2026'
      }),
      subject: 'Pagamento Confirmado! ✅ - Kipo PRO'
    },
    {
      name: 'Pagamento Recusado',
      template: () => templates.paymentFailedTemplate({
        name: 'Tone Lopes',
        companyName: 'Bistrô do Tone'
      }),
      subject: 'Problema com seu pagamento ⚠️ - Kipo'
    }
  ];

  for (const item of testBatch) {
    try {
      console.log(`📤 Enviando: ${item.name}...`);
      const result = await sendEmail({
        to: targetEmail,
        subject: item.subject,
        html: item.template()
      });

      if (result?.success) {
        console.log(`✅ ${item.name} enviado! ID: ${result.id}`);
      } else {
        console.error(`❌ Falha ao enviar ${item.name}`);
      }
    } catch (error) {
      console.error(`💥 Erro em ${item.name}:`, error);
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✨ Processo concluído! Verifique sua caixa de entrada.');
}

sendAllTemplates();
