import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export interface CRMAlert {
  id: string;
  title: string;
  customerName: string;
  customerId: string;
  dueDate: Date;
  type: "TASK" | "BIRTHDAY";
}

export async function getCRMAlerts(): Promise<CRMAlert[]> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return [];

  const now = new Date();

  // 1. Fetch overdue task items
  const overdueItems = await db.checklistItem.findMany({
    where: {
      companyId,
      isChecked: false,
      dueDate: {
        lte: now,
      },
    },
    include: {
      checklist: {
        include: {
          customer: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  const taskAlerts: CRMAlert[] = overdueItems.map((item) => ({
    id: item.id,
    title: item.title,
    customerName: item.checklist.customer.name,
    customerId: item.checklist.customerId,
    dueDate: item.dueDate!,
    type: "TASK",
  }));

  // 2. Fetch birthday reminders
  const birthdayReminders = await db.customer.findMany({
    where: {
      companyId,
      birthdayReminderDate: {
        lte: now,
      },
    },
    orderBy: {
      birthdayReminderDate: "asc",
    },
  });

  const birthdayAlerts: CRMAlert[] = birthdayReminders.map((customer) => ({
    id: `bday-${customer.id}`,
    title: `Aniversário: ${customer.birthday ? new Date(customer.birthday).toLocaleDateString("pt-BR") : ""}`,
    customerName: customer.name,
    customerId: customer.id,
    dueDate: customer.birthdayReminderDate!,
    type: "BIRTHDAY",
  }));

  // Combine and sort by date
  return [...taskAlerts, ...birthdayAlerts].sort(
    (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
  );
}
