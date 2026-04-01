import { db } from "./app/_lib/prisma";

async function check() {
  try {
    const columns = await db.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Customer' AND column_name = 'birthdayReminderDate'
    `;
    console.log("Customer columns:", columns);

    const checklistItemColumns = await db.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ChecklistItem' AND (column_name = 'dueDate' OR column_name = 'completedAt')
    `;
    console.log("ChecklistItem columns:", checklistItemColumns);
  } catch (e) {
    console.error("Error checking columns:", e);
  } finally {
    process.exit(0);
  }
}

check();
