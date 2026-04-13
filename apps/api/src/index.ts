import { createApp } from "./app.js";
import { startSearchIndexWorker } from "./workers/searchIndexer.js";
import { startEmailWorker } from "./workers/emailSender.js";

const PORT = parseInt(process.env["PORT"] ?? "3001", 10);

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

// Start BullMQ workers in the same process for simplicity.
// In production you'd run these as a separate Fly.io process/machine.
const searchWorker = startSearchIndexWorker();
const emailWorker = startEmailWorker();

async function shutdown(signal: string) {
  console.log(`${signal} received — shutting down`);
  await searchWorker.close();
  await emailWorker.close();
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
