"use server";

import { getCRMAlerts } from "@/app/_data-access/crm/get-crm-alerts";
import { ALL_ROLES, assertRole } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";

export const getCRMAlertsAction = actionClient
  .action(async () => {
    await assertRole(ALL_ROLES);
    return await getCRMAlerts();
  });
