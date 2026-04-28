import { PrismaClient } from "@prisma/client";
import { fakerPT_BR as faker } from "@faker-js/faker";

export async function seedCustomers(prisma: PrismaClient, companyId: string) {
  console.log("👥 Seeding customers and CRM stages...");

  // 1. Customer Categories
  const custCategoriesNames = ["Coworking", "Restaurante", "Bistrô", "Evento", "Outros"];
  const custCategories: Record<string, any> = {};
  for (const name of custCategoriesNames) {
    const category = await prisma.customerCategory.upsert({
      where: { name_companyId: { name, companyId } },
      update: {},
      create: { name, companyId },
    });
    custCategories[name] = category;
  }

  // 2. CRM Stages
  const stagesData = [
    { name: "Prospecção", order: 0 },
    { name: "Contato Feito", order: 1 },
    { name: "Proposta Enviada", order: 2 },
    { name: "Convertido", order: 3 },
  ];
  const stages: Record<string, any> = {};
  for (const s of stagesData) {
    const stage = await prisma.cRMStage.upsert({
      where: { name_companyId: { name: s.name, companyId } },
      update: { order: s.order },
      create: { ...s, companyId },
    });
    stages[s.name] = stage;
  }

  // 3. Customers
  const customers: any[] = [];
  
  // Fixed Customer for E2E Tests
  const testCustomer = await prisma.customer.create({
    data: {
      name: "Cliente SDET Teste",
      email: "sdet@test.com",
      phone: "11999999999",
      categories: {
        connect: { id: custCategories["Outros"].id },
      },
      stageId: stages["Convertido"].id,
      companyId,
    },
  });
  customers.push(testCustomer);

  for (let i = 0; i < 20; i++) {
    const categoryName = faker.helpers.arrayElement(custCategoriesNames);
    const stageName = faker.helpers.arrayElement(stagesData).name;
    const customer = await prisma.customer.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        categories: {
          connect: { id: custCategories[categoryName].id },
        },
        stageId: stages[stageName].id,
        companyId,
        notes: faker.lorem.sentence(),
      },
    });
    customers.push(customer);
  }

  return { customers, stages, categories: custCategories };
}
