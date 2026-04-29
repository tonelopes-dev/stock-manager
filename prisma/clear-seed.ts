import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const SEED_COMPANY_ID = "rota-360-id";

  console.log(`🧹 Starting cleanup for seed company: ${SEED_COMPANY_ID}...`);

  try {
    // 2. Cleanup Company data
    const company = await prisma.company.findUnique({
      where: { id: SEED_COMPANY_ID },
    });

    if (company) {
      console.log("🗑️ Deleting related records for company (ordered for FK safety)...");
      
      // Dependent operational data
      await prisma.stockMovement.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      await prisma.stockEntry.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      await prisma.saleItem.deleteMany({ where: { sale: { companyId: SEED_COMPANY_ID } } });
      await prisma.sale.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      await prisma.orderItem.deleteMany({ where: { order: { companyId: SEED_COMPANY_ID } } });
      await prisma.order.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      await prisma.productionOrder.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      
      // Catalog & Composition
      await prisma.productComposition.deleteMany({ where: { parent: { companyId: SEED_COMPANY_ID } } });
      await prisma.productSupplier.deleteMany({ where: { product: { companyId: SEED_COMPANY_ID } } });
      await prisma.product.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      await prisma.category.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      await prisma.environment.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      await prisma.supplier.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      
      // Management & CRM
      await prisma.checklistItem.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      await prisma.checklist.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      await prisma.checklistTemplate.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      await prisma.goal.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      await prisma.notification.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      await prisma.fixedExpense.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      await prisma.auditEvent.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      
      // CRM
      await prisma.customer.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      await prisma.customerCategory.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      await prisma.cRMStage.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      
      // Company Structure
      await prisma.userCompany.deleteMany({ where: { companyId: SEED_COMPANY_ID } });
      await prisma.companyInvitation.deleteMany({ where: { companyId: SEED_COMPANY_ID } });

      // 👤 Now it is safe to delete seed users
      console.log("👤 Deleting seed users...");
      const seedEmails = [
        "matheus@rota360.com",
        "everton@rota360.com",
        "atendente@rota360.com"
      ];
      await prisma.user.deleteMany({
        where: {
          email: { in: seedEmails }
        }
      });

      // Final Company Delete
      await prisma.company.delete({
        where: { id: SEED_COMPANY_ID },
      });
      console.log("🏢 Seed company deleted.");
    } else {
      console.log("ℹ️ Seed company already gone.");
      
      // Still try to delete users just in case they were left orphaned
      console.log("👤 Cleaning up potential orphaned seed users...");
      const seedEmails = [
        "matheus@rota360.com",
        "everton@rota360.com",
        "atendente@rota360.com"
      ];
      await prisma.user.deleteMany({
        where: {
          email: { in: seedEmails }
        }
      });
    }

    console.log("✅ Cleanup complete!");
  } catch (error) {
    console.error("❌ Error clearing seed data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
