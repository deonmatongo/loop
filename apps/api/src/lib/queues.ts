import { Queue } from "bullmq";
import { redis } from "./redis.js";

export const searchIndexQueue = new Queue("search-index", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  },
});

export const emailQueue = new Queue("email", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  },
});

export type SearchIndexJob = {
  articleId: string;
};

export type EmailJob =
  | { type: "workspace-invite"; to: string; workspaceName: string; inviterName: string }
  | { type: "welcome"; to: string; displayName: string };
