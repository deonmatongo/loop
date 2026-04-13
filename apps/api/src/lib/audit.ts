import { prisma, Prisma } from "@loop/db";

type AuditParams = {
  workspaceId: string;
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(params: AuditParams): Promise<void> {
  await prisma.auditLog.create({
    data: {
      workspaceId: params.workspaceId,
      actorId: params.actorId ?? null,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      metadata: (params.metadata as Prisma.InputJsonValue | undefined) ?? Prisma.DbNull,
    },
  });
}
