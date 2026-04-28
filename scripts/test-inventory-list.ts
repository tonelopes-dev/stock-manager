import { getIngredients } from "../app/_data-access/ingredient/get-ingredients";
import * as dotenv from "dotenv";

dotenv.config();

async function test() {
  process.env.COMPANY_ID = "rota-360-id"; // Mocking for local test
  console.log("--- TESTANDO LISTAGEM DE ESTOQUE ---");
  const result = await getIngredients({ pageSize: 100 });
  
  const mtoProducao = result.data.filter(i => i.type === "PRODUCAO_PROPRIA");
  console.log(`Encontrados ${mtoProducao.length} itens de Produção Própria no estoque.`);
  mtoProducao.forEach(i => console.log(`- ${i.name} (ID: ${i.id})`));
}

test().catch(console.error);
