import type { Request, Response, NextFunction } from "express";
import { prisma } from "@loop/db";

/**
 * Resolves the workspace from :workspaceSlug, verifies the requesting user
 * is a member, and attaches both to req.workspace and req.membership.
 *
 * Must be used after requireAuth.
 */
export async function requireMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { workspaceSlug } = req.params;

  if (!workspaceSlug) {
    res.status(400).json({ error: "workspaceSlug param is required" });
    return;
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  });

  if (!workspace) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  const membership = await prisma.membership.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: req.user!.id,
      },
    },
  });

  if (!membership) {
    res.status(403).json({ error: "Not a member of this workspace" });
    return;
  }

  req.workspace = workspace;
  req.membership = membership;
  next();
}
