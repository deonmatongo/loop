import { Router, type Router as ExpressRouter } from "express";
import { prisma } from "@loop/db";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireMember } from "../middleware/requireMember.js";
import { asyncHandler } from "../middleware/errors.js";

export const searchRouter: ExpressRouter = Router({ mergeParams: true });

searchRouter.get(
  "/",
  requireAuth,
  requireMember,
  asyncHandler(async (req, res) => {
    const q = typeof req.query["q"] === "string" ? req.query["q"].trim() : "";

    if (!q || q.length < 2) {
      res.json({ results: [] });
      return;
    }

    // Postgres websearch_to_tsquery understands natural language input ("hello world" as phrase, etc.)
    type SearchRow = { id: string; slug: string; title: string; rank: number };
    const results = await prisma.$queryRaw<SearchRow[]>`
      SELECT
        id,
        slug,
        title,
        ts_rank("searchVector", websearch_to_tsquery('english', ${q})) AS rank
      FROM articles
      WHERE
        "workspaceId" = ${req.workspace!.id}
        AND "searchVector" @@ websearch_to_tsquery('english', ${q})
      ORDER BY rank DESC
      LIMIT 20
    `;

    res.json({ results });
  })
);
