import { Router, type Router as ExpressRouter } from "express";
import { prisma } from "@loop/db";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireMember } from "../middleware/requireMember.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../middleware/errors.js";

export const auditRouter: ExpressRouter = Router({ mergeParams: true });

auditRouter.get(
  "/",
  requireAuth,
  requireMember,
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt((req.query["page"] as string) ?? "1", 10));
    const limit = 50;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { workspaceId: req.workspace!.id },
        include: {
          actor: { select: { id: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where: { workspaceId: req.workspace!.id } }),
    ]);

    res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  })
);
