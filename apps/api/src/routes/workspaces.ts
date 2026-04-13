import { Router, type Router as ExpressRouter } from "express";
import { prisma } from "@loop/db";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireMember } from "../middleware/requireMember.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../middleware/errors.js";
import { writeAuditLog } from "../lib/audit.js";
import {
  CreateWorkspaceSchema,
  UpdateWorkspaceSchema,
  InviteMemberSchema,
  UpdateMemberRoleSchema,
} from "@loop/shared";

export const workspacesRouter: ExpressRouter = Router();

// List all workspaces the user belongs to
workspacesRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const memberships = await prisma.membership.findMany({
      where: { userId: req.user!.id },
      include: { workspace: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ workspaces: memberships.map((m) => ({ ...m.workspace, role: m.role })) });
  })
);

// Create a workspace — creator becomes OWNER
workspacesRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = CreateWorkspaceSchema.parse(req.body);

    const existing = await prisma.workspace.findUnique({ where: { slug: body.slug } });
    if (existing) {
      res.status(409).json({ error: "Slug already taken" });
      return;
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: body.name,
        slug: body.slug,
        memberships: { create: { userId: req.user!.id, role: "OWNER" } },
      },
    });

    await writeAuditLog({
      workspaceId: workspace.id,
      actorId: req.user!.id,
      action: "workspace.created",
      resourceType: "workspace",
      resourceId: workspace.id,
    });

    res.status(201).json({ workspace });
  })
);

// Get a workspace
workspacesRouter.get(
  "/:workspaceSlug",
  requireAuth,
  requireMember,
  asyncHandler(async (req, res) => {
    res.json({ workspace: req.workspace, role: req.membership!.role });
  })
);

// Update a workspace (OWNER only)
workspacesRouter.patch(
  "/:workspaceSlug",
  requireAuth,
  requireMember,
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const body = UpdateWorkspaceSchema.parse(req.body);
    const data: { name?: string } = {};
    if (body.name !== undefined) data.name = body.name;
    const workspace = await prisma.workspace.update({
      where: { id: req.workspace!.id },
      data,
    });

    await writeAuditLog({
      workspaceId: workspace.id,
      actorId: req.user!.id,
      action: "workspace.updated",
      resourceType: "workspace",
      resourceId: workspace.id,
      metadata: body,
    });

    res.json({ workspace });
  })
);

// Delete a workspace (OWNER only)
workspacesRouter.delete(
  "/:workspaceSlug",
  requireAuth,
  requireMember,
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    await prisma.workspace.delete({ where: { id: req.workspace!.id } });
    res.status(204).send();
  })
);

// ─── Members ──────────────────────────────────────────────────────────────────

workspacesRouter.get(
  "/:workspaceSlug/members",
  requireAuth,
  requireMember,
  asyncHandler(async (req, res) => {
    const members = await prisma.membership.findMany({
      where: { workspaceId: req.workspace!.id },
      include: {
        user: { select: { id: true, email: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json({ members });
  })
);

// Invite a member by email (OWNER only)
workspacesRouter.post(
  "/:workspaceSlug/members",
  requireAuth,
  requireMember,
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const body = InviteMemberSchema.parse(req.body);

    const invitee = await prisma.user.findUnique({ where: { email: body.email } });
    if (!invitee) {
      res.status(404).json({ error: "No user with that email" });
      return;
    }

    const existing = await prisma.membership.findUnique({
      where: { workspaceId_userId: { workspaceId: req.workspace!.id, userId: invitee.id } },
    });
    if (existing) {
      res.status(409).json({ error: "User is already a member" });
      return;
    }

    const membership = await prisma.membership.create({
      data: { workspaceId: req.workspace!.id, userId: invitee.id, role: body.role },
      include: { user: { select: { id: true, email: true, displayName: true } } },
    });

    await writeAuditLog({
      workspaceId: req.workspace!.id,
      actorId: req.user!.id,
      action: "member.added",
      resourceType: "membership",
      resourceId: membership.id,
      metadata: { email: body.email, role: body.role },
    });

    res.status(201).json({ membership });
  })
);

// Update a member's role (OWNER only)
workspacesRouter.patch(
  "/:workspaceSlug/members/:userId",
  requireAuth,
  requireMember,
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const body = UpdateMemberRoleSchema.parse(req.body);
    const { userId } = req.params;

    // Prevent an owner from downgrading themselves if they're the last owner
    if (userId === req.user!.id) {
      const ownerCount = await prisma.membership.count({
        where: { workspaceId: req.workspace!.id, role: "OWNER" },
      });
      if (ownerCount === 1 && body.role !== "OWNER") {
        res.status(400).json({ error: "Cannot remove the last owner" });
        return;
      }
    }

    const membership = await prisma.membership.update({
      where: { workspaceId_userId: { workspaceId: req.workspace!.id, userId: userId! } },
      data: { role: body.role },
    });

    await writeAuditLog({
      workspaceId: req.workspace!.id,
      actorId: req.user!.id,
      action: "member.role_changed",
      resourceType: "membership",
      resourceId: membership.id,
      metadata: { userId, newRole: body.role },
    });

    res.json({ membership });
  })
);

// Remove a member (OWNER only, or self-removal)
workspacesRouter.delete(
  "/:workspaceSlug/members/:userId",
  requireAuth,
  requireMember,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const isSelf = userId === req.user!.id;
    const isOwner = req.membership!.role === "OWNER";

    if (!isSelf && !isOwner) {
      res.status(403).json({ error: "Requires OWNER role" });
      return;
    }

    if (isSelf && req.membership!.role === "OWNER") {
      const ownerCount = await prisma.membership.count({
        where: { workspaceId: req.workspace!.id, role: "OWNER" },
      });
      if (ownerCount === 1) {
        res.status(400).json({ error: "Cannot leave — you are the last owner" });
        return;
      }
    }

    await prisma.membership.delete({
      where: { workspaceId_userId: { workspaceId: req.workspace!.id, userId: userId! } },
    });

    await writeAuditLog({
      workspaceId: req.workspace!.id,
      actorId: req.user!.id,
      action: "member.removed",
      resourceType: "membership",
      resourceId: userId!,
    });

    res.status(204).send();
  })
);
