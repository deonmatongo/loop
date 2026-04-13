import { Router, type Router as ExpressRouter } from "express";
import { prisma } from "@loop/db";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireMember } from "../middleware/requireMember.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../middleware/errors.js";
import { writeAuditLog } from "../lib/audit.js";
import {
  CreatePlaybookSchema,
  UpdatePlaybookSchema,
  AddPlaybookItemSchema,
  ReorderPlaybookSchema,
} from "@loop/shared";

export const playbooksRouter: ExpressRouter = Router({ mergeParams: true });

playbooksRouter.get(
  "/",
  requireAuth,
  requireMember,
  asyncHandler(async (req, res) => {
    const playbooks = await prisma.playbook.findMany({
      where: { workspaceId: req.workspace!.id },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ playbooks });
  })
);

playbooksRouter.post(
  "/",
  requireAuth,
  requireMember,
  requireRole("EDITOR"),
  asyncHandler(async (req, res) => {
    const body = CreatePlaybookSchema.parse(req.body);
    const playbook = await prisma.playbook.create({
      data: {
        workspaceId: req.workspace!.id,
        title: body.title,
        description: body.description ?? null,
      },
    });

    await writeAuditLog({
      workspaceId: req.workspace!.id,
      actorId: req.user!.id,
      action: "playbook.created",
      resourceType: "playbook",
      resourceId: playbook.id,
    });

    res.status(201).json({ playbook });
  })
);

playbooksRouter.get(
  "/:playbookId",
  requireAuth,
  requireMember,
  asyncHandler(async (req, res) => {
    const playbookId = req.params["playbookId"]!;

    const playbook = await prisma.playbook.findFirst({
      where: { id: playbookId, workspaceId: req.workspace!.id },
      include: {
        items: {
          include: {
            article: { select: { id: true, slug: true, title: true, publishedAt: true } },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!playbook) {
      res.status(404).json({ error: "Playbook not found" });
      return;
    }

    const completions = await prisma.playbookCompletion.findMany({
      where: { playbookId: playbook.id, userId: req.user!.id },
      select: { articleId: true },
    });
    const completedSet = new Set(completions.map((c) => c.articleId));

    const itemsWithProgress = playbook.items.map((item) => ({
      ...item,
      completed: completedSet.has(item.articleId),
    }));

    res.json({ playbook: { ...playbook, items: itemsWithProgress } });
  })
);

playbooksRouter.patch(
  "/:playbookId",
  requireAuth,
  requireMember,
  requireRole("EDITOR"),
  asyncHandler(async (req, res) => {
    const body = UpdatePlaybookSchema.parse(req.body);
    const playbookId = req.params["playbookId"]!;

    const existing = await prisma.playbook.findFirst({
      where: { id: playbookId, workspaceId: req.workspace!.id },
    });
    if (!existing) {
      res.status(404).json({ error: "Playbook not found" });
      return;
    }

    // Build update object without undefined values — exactOptionalPropertyTypes safe
    const data: { title?: string; description?: string | null } = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description ?? null;

    const playbook = await prisma.playbook.update({ where: { id: existing.id }, data });
    res.json({ playbook });
  })
);

playbooksRouter.delete(
  "/:playbookId",
  requireAuth,
  requireMember,
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const playbookId = req.params["playbookId"]!;

    const existing = await prisma.playbook.findFirst({
      where: { id: playbookId, workspaceId: req.workspace!.id },
    });
    if (!existing) {
      res.status(404).json({ error: "Playbook not found" });
      return;
    }

    await prisma.playbook.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ─── Playbook items ────────────────────────────────────────────────────────────

playbooksRouter.post(
  "/:playbookId/items",
  requireAuth,
  requireMember,
  requireRole("EDITOR"),
  asyncHandler(async (req, res) => {
    const body = AddPlaybookItemSchema.parse(req.body);
    const playbookId = req.params["playbookId"]!;

    const playbook = await prisma.playbook.findFirst({
      where: { id: playbookId, workspaceId: req.workspace!.id },
    });
    if (!playbook) {
      res.status(404).json({ error: "Playbook not found" });
      return;
    }

    const article = await prisma.article.findFirst({
      where: { id: body.articleId, workspaceId: req.workspace!.id },
    });
    if (!article) {
      res.status(404).json({ error: "Article not found in this workspace" });
      return;
    }

    const item = await prisma.playbookItem.create({
      data: { playbookId: playbook.id, articleId: body.articleId, position: body.position },
    });

    res.status(201).json({ item });
  })
);

playbooksRouter.put(
  "/:playbookId/items/reorder",
  requireAuth,
  requireMember,
  requireRole("EDITOR"),
  asyncHandler(async (req, res) => {
    const body = ReorderPlaybookSchema.parse(req.body);
    const playbookId = req.params["playbookId"]!;

    const playbook = await prisma.playbook.findFirst({
      where: { id: playbookId, workspaceId: req.workspace!.id },
    });
    if (!playbook) {
      res.status(404).json({ error: "Playbook not found" });
      return;
    }

    await prisma.$transaction(
      body.items.map(({ id, position }) =>
        prisma.playbookItem.update({ where: { id }, data: { position } })
      )
    );

    res.status(204).send();
  })
);

playbooksRouter.delete(
  "/:playbookId/items/:itemId",
  requireAuth,
  requireMember,
  requireRole("EDITOR"),
  asyncHandler(async (req, res) => {
    await prisma.playbookItem.deleteMany({
      where: {
        id: req.params["itemId"]!,
        playbook: { id: req.params["playbookId"]!, workspaceId: req.workspace!.id },
      },
    });
    res.status(204).send();
  })
);

// ─── Completion tracking ───────────────────────────────────────────────────────

playbooksRouter.post(
  "/:playbookId/complete/:articleId",
  requireAuth,
  requireMember,
  asyncHandler(async (req, res) => {
    const playbookId = req.params["playbookId"]!;
    const articleId = req.params["articleId"]!;

    const item = await prisma.playbookItem.findFirst({
      where: { playbookId, articleId, playbook: { workspaceId: req.workspace!.id } },
    });

    if (!item) {
      res.status(404).json({ error: "Article is not part of this playbook" });
      return;
    }

    const completion = await prisma.playbookCompletion.upsert({
      where: { playbookId_articleId_userId: { playbookId, articleId, userId: req.user!.id } },
      update: {},
      create: { playbookId, articleId, userId: req.user!.id },
    });

    res.status(201).json({ completion });
  })
);

playbooksRouter.delete(
  "/:playbookId/complete/:articleId",
  requireAuth,
  requireMember,
  asyncHandler(async (req, res) => {
    await prisma.playbookCompletion.deleteMany({
      where: {
        playbookId: req.params["playbookId"]!,
        articleId: req.params["articleId"]!,
        userId: req.user!.id,
      },
    });
    res.status(204).send();
  })
);
