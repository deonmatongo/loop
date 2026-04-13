import { Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import { prisma } from "@loop/db";
import type { SearchIndexJob } from "../lib/queues.js";

/**
 * Manually re-computes the tsvector for an article.
 * In practice the Postgres trigger handles most updates — this worker
 * is a fallback for bulk re-indexing or after bulk content imports.
 */
export function startSearchIndexWorker() {
  const worker = new Worker<SearchIndexJob>(
    "search-index",
    async (job) => {
      const { articleId } = job.data;

      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: { id: true, title: true, content: true },
      });

      if (!article) return;

      await prisma.$executeRaw`
        UPDATE articles
        SET "searchVector" =
          setweight(to_tsvector('english', ${article.title}), 'A') ||
          setweight(to_tsvector('english', ${article.content}), 'B')
        WHERE id = ${article.id}
      `;

      console.log(`[search-indexer] Indexed article ${articleId}`);
    },
    { connection: redis, concurrency: 5 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[search-indexer] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
