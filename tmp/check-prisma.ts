import { db } from "../app/_lib/prisma";

async function main() {
  console.log("--- DIRETÓRIO ATUAL ---");
  console.log(process.cwd());
  
  console.log("\n--- TESTANDO MODELOS PRISMA ---");
  
  try {
    // @ts-ignore
    const historyCount = await db.orderStatusHistory.count();
    console.log("✅ db.orderStatusHistory: OK (Count: " + historyCount + ")");
  } catch (e: any) {
    console.log("❌ db.orderStatusHistory: FALHA (" + e.message + ")");
  }

  try {
    // @ts-ignore
    const saleFields = Object.keys(db.sale.fields || {});
    console.log("✅ db.sale: OK");
    // @ts-ignore
    const hasDeliveryFee = 'deliveryFee' in db.sale || 'deliveryFee' in (db.sale as any).fields; 
    console.log("🔍 Campo 'deliveryFee': " + (hasDeliveryFee ? "PRESENTE" : "AUSENTE"));
  } catch (e: any) {
    console.log("❌ db.sale: FALHA (" + e.message + ")");
  }
}

main().catch(console.error);
