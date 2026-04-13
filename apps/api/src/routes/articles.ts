import { Router, type Router as ExpressRouter } from "express";
import { prisma } from "@loop/db";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireMember } from "../middleware/requireMember.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../middleware/errors.js";
import { writeAuditLog } from "../lib/audit.js";
import { CreateArticleSchema, UpdateArticleSchema } from "@loop/shared";

export const articlesRouter: ExpressRouter = Router({ mergeParams: true });

// List articles in a workspace
articlesRouter.get(
  "/",
  requireAuth,
  requireMember,
  asyncHandler(async (req, res) => {
    const articles = await prisma.article.findMany({
      where: { workspaceId: req.workspace!.id },
      select: {
        id: true,
        slug: true,
        title: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { versions: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ articles });
  })
);

// Create an article (EDITOR+)
articlesRouter.post(
  "/",
  requireAuth,
  requireMember,
  requireRole("EDITOR"),
  asyncHandler(async (req, res) => {
    const body = CreateArticleSchema.parse(req.body);

    const existing = await prisma.article.findUnique({
      where: { workspaceId_slug: { workspaceId: req.workspace!.id, slug: body.slug } },
    });
    if (existing) {
      res.status(409).json({ error: "An article with that slug already exists" });
      return;
    }

    const article = await prisma.article.create({
      data: {
        workspaceId: req.workspace!.id,
        slug: body.slug,
        title: body.title,
        content: body.content,
        versions: {
          create: {
            authorId: req.user!.id,
            versionNumber: 1,
            title: body.title,
            content: body.content,
            changeSummary: "Initial version" as string | null,
          },
        },
      },
    });

    await writeAuditLog({
      workspaceId: req.workspace!.id,
      actorId: req.user!.id,
      action: "article.created",
      resourceType: "article",
      resourceId: article.id,
    });

    res.status(201).json({ article });
  })
);

// Get a single article
articlesRouter.get(
  "/:articleSlug",
  requireAuth,
  requireMember,
  asyncHandler(async (req, res) => {
    const article = await prisma.article.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId: req.workspace!.id,
          slug: req.params["articleSlug"]!,
        },
      },
    });

    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    res.json({ article });
  })
);

// Update an article — creates a new version (EDITOR+)
articlesRouter.patch(
  "/:articleSlug",
  requireAuth,
  requireMember,
  requireRole("EDITOR"),
  asyncHandler(async (req, res) => {
    const body = UpdateArticleSchema.parse(req.body);

    const existing = await prisma.article.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId: req.workspace!.id,
          slug: req.params["articleSlug"]!,
        },
      },
      include: { _count: { select: { versions: true } } },
    });

    if (!existing) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    const nextVersion = existing._count.versions + 1;

    const article = await prisma.article.update({
      where: { id: existing.id },
      data: {
        title: body.title ?? existing.title,
        content: body.content ?? existing.content,
        publishedAt: body.publish ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
        versions: {
          create: {
            authorId: req.user!.id,
            versionNumber: nextVersion,
            title: body.title ?? existing.title,
            content: body.content ?? existing.content,
            changeSummary: body.changeSummary ?? null,
          },
        },
      },
    });

    await writeAuditLog({
      workspaceId: req.workspace!.id,
      actorId: req.user!.id,
      action: body.publish ? "article.published" : "article.updated",
      resourceType: "article",
      resourceId: article.id,
      metadata: { version: nextVersion },
    });

    res.json({ article });
  })
);

// Delete an article (OWNER only)
articlesRouter.delete(
  "/:articleSlug",
  requireAuth,
  requireMember,
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const article = await prisma.article.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId: req.workspace!.id,
          slug: req.params["articleSlug"]!,
        },
      },
    });

    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    await prisma.article.delete({ where: { id: article.id } });

    await writeAuditLog({
      workspaceId: req.workspace!.id,
      actorId: req.user!.id,
      action: "article.deleted",
      resourceType: "article",
      resourceId: article.id,
    });

    res.status(204).send();
  })
);

// ─── Version history ───────────────────────────────────────────────────────────

articlesRouter.get(
  "/:articleSlug/versions",
  requireAuth,
  requireMember,
  asyncHandler(async (req, res) => {
    const article = await prisma.article.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId: req.workspace!.id,
          slug: req.params["articleSlug"]!,
        },
      },
    });

    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    const versions = await prisma.articleVersion.findMany({
      where: { articleId: article.id },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { versionNumber: "desc" },
    });

    res.json({ versions });
  })
);

articlesRouter.get(
  "/:articleSlug/versions/:versionNumber",
  requireAuth,
  requireMember,
  asyncHandler(async (req, res) => {
    const article = await prisma.article.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId: req.workspace!.id,
          slug: req.params["articleSlug"]!,
        },
      },
    });

    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    const version = await prisma.articleVersion.findUnique({
      where: {
        articleId_versionNumber: {
          articleId: article.id,
          versionNumber: parseInt(req.params["versionNumber"]!, 10),
        },
      },
      include: { author: { select: { id: true, displayName: true, avatarUrl: true } } },
    });

    if (!version) {
      res.status(404).json({ error: "Version not found" });
      return;
    }

    res.json({ version });
  })
);
