"use server";

import { getCRMAlerts } from "@/app/_data-access/crm/get-crm-alerts";
import { PERMISSIONS } from "@/app/_lib/permissions";
import { assertActionCapability } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";

export const getCRMAlertsAction = actionClient
  .action(async () => {
    await assertActionCapability(PERMISSIONS.CUSTOMER_VIEW);
    return await getCRMAlerts();
  });
