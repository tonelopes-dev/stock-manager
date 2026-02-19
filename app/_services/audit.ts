import { db } from "@/app/_lib/prisma";
import { auth } from "@/app/_lib/auth";
import { AuditEventType, AuditSeverity, Prisma } from "@prisma/client";

interface LogEventParams {
  type: AuditEventType;
  severity?: AuditSeverity;
  companyId?: string;
  entityType?: "USER" | "COMPANY" | "PRODUCT" | "SALE" | "TEAM_MEMBER" | "BILLING";
  entityId?: string;
  metadata?: Prisma.JsonValue;
  metadataVersion?: number;
}

export class AuditService {
  static async log({
    type,
    severity = AuditSeverity.INFO,
    companyId,
    entityType,
    entityId,
    metadata = {},
    metadataVersion = 1,
  }: LogEventParams) {
    const session = await auth();
    const actorId = session?.user?.id;
    const actorName = session?.user?.name;
    const actorEmail = session?.user?.email;

    if (!actorId) {
      console.warn(`[AuditService] Attempted to log event ${type} without an authenticated actor.`);
      return;
    }

    try {
      return await db.auditEvent.create({
        data: {
          type,
          severity,
          companyId,
          actorId,
          actorName,
          actorEmail,
          entityType,
          entityId,
          metadata: metadata ?? Prisma.DbNull,


          metadataVersion,
        },
      });
    } catch (error) {
      console.error("[AuditService] Failed to create audit event:", error);
    }
  }

  // Helper for internal transactions (where we already have the tx client)
  static async logWithTransaction(
    tx: Omit<typeof db, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
    {
      type,
      severity = AuditSeverity.INFO,
      companyId,
      entityType,
      entityId,
      metadata = {},
      metadataVersion = 1,
    }: LogEventParams
  ) {
    const session = await auth();
    const actorId = session?.user?.id;
    const actorName = session?.user?.name;
    const actorEmail = session?.user?.email;

    if (!actorId) return;

    return await tx.auditEvent.create({
      data: {
        type,
        severity,
        companyId,
        actorId,
        actorName,
        actorEmail,
        entityType,
        entityId,
        metadata: metadata ?? Prisma.DbNull,


        metadataVersion,
      },
    });
  }

  static async getAuditLogs({
    companyId,
    type,
    actorId,
    startDate,
    endDate,
    limit = 20,
    cursor,
  }: {
    companyId: string;
    type?: AuditEventType;
    actorId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    cursor?: string;
  }) {
    const where: { 
      companyId: string; 
      type?: AuditEventType; 
      actorId?: string; 
      createdAt?: { gte?: Date; lte?: Date } 
    } = { companyId };

    if (type) where.type = type;
    if (actorId) where.actorId = actorId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const logs = await db.auditEvent.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: { name: true, email: true, image: true }
        }
      }
    });

    let nextCursor: string | undefined = undefined;
    if (logs.length > limit) {
      const nextItem = logs.pop();
      nextCursor = nextItem?.id;
    }

    return {
      logs,
      nextCursor,
    };
  }
}

