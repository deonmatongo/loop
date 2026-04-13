import { Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import type { EmailJob } from "../lib/queues.js";

/**
 * Email worker stub — swap the console.log calls with your email provider
 * (Resend, Postmark, etc.) when you're ready. The queue and job shape are
 * already wired; you just replace the send logic.
 */
export function startEmailWorker() {
  const worker = new Worker<EmailJob>(
    "email",
    async (job) => {
      const data = job.data;

      switch (data.type) {
        case "welcome":
          console.log(`[email] Welcome email → ${data.to} (${data.displayName})`);
          break;

        case "workspace-invite":
          console.log(
            `[email] Invite email → ${data.to} for "${data.workspaceName}" from ${data.inviterName}`
          );
          break;
      }
    },
    { connection: redis, concurrency: 10 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[email] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
