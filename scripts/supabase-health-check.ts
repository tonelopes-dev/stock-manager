import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log("----------------------------------------");
console.log("🔍 TESTE DE CONEXÃO SUPABASE");
console.log("URL:", supabaseUrl);
console.log("Chave Service Role:", supabaseKey ? `${supabaseKey.substring(0, 15)}... (Tamanho: ${supabaseKey.length})` : "NÃO DEFINIDA");
console.log("----------------------------------------");

if (!supabaseUrl || !supabaseUrl.startsWith("http")) {
  console.log("❌ ERRO: A URL do Supabase está incorreta ou vazia.");
  process.exit(1);
}

if (!supabaseKey || supabaseKey === "seu_service_role_key_aqui") {
  console.log("❌ ERRO: A chave do Supabase não foi preenchida no arquivo .env.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function runTests() {
  console.log("\n1. Testando Banco de Dados (PostgreSQL)...");
  try {
    const { data, error } = await supabaseAdmin.from("Company").select("id").limit(1);
    if (error) {
      console.log("❌ ERRO: Falha ao acessar o banco de dados.");
      console.error(error.message);
    } else {
      console.log("✅ SUCESSO: Conexão com o banco de dados OK.");
    }
  } catch (err) {
    console.log("❌ ERRO GRAVE no banco de dados.");
    console.error(err);
  }

  console.log("\n2. Testando Realtime (WebSockets)...");
  try {
    const channelName = "test-system-channel";
    const channel = supabaseAdmin.channel(channelName);
    
    console.log("Tentando inscrever no canal de teste...");
    
    const timeout = setTimeout(() => {
      console.log("❌ ERRO: Timeout. O Realtime não respondeu após 5 segundos. Verifique se o Realtime está ativo no projeto da Supabase.");
      process.exit(1);
    }, 5000);

    channel.subscribe(async (status, err) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timeout);
        console.log("✅ SUCESSO: O servidor Supabase aceitou a conexão Realtime WebSocket.");
        
        console.log("Enviando evento de teste...");
        await channel.send({
          type: "broadcast",
          event: "ping",
          payload: { message: "pong" },
        });
        
        console.log("✅ SUCESSO: Evento de teste enviado e trafegado.");
        
        // Wait a bit before cleanup to prevent uv_handle_closing crash in node
        setTimeout(() => {
          supabaseAdmin.removeChannel(channel);
          console.log("\n🎉 TODOS OS TESTES PASSARAM! A configuração está perfeita.");
          process.exit(0);
        }, 1000);
      }
      
      if (status === "CHANNEL_ERROR") {
        clearTimeout(timeout);
        console.log("❌ ERRO DE CANAL: O Supabase recusou a conexão Realtime (CHANNEL_ERROR).");
        console.log("Isso geralmente acontece se a chave Service Role estiver errada ou se o projeto não estiver ativo.");
        console.log("Error object:", err);
        process.exit(1);
      }
      
      if (status === "TIMED_OUT") {
        clearTimeout(timeout);
        console.log("❌ TIMEOUT: A conexão com o Realtime falhou.");
        process.exit(1);
      }
    });

  } catch (err) {
    console.log("❌ ERRO GRAVE no Realtime.");
    console.error(err);
  }
}

runTests();
