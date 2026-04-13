import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { authRouter } from "./routes/auth.js";
import { workspacesRouter } from "./routes/workspaces.js";
import { articlesRouter } from "./routes/articles.js";
import { searchRouter } from "./routes/search.js";
import { playbooksRouter } from "./routes/playbooks.js";
import { auditRouter } from "./routes/audit.js";
import { billingRouter, stripeWebhookRouter } from "./routes/billing.js";
import { errorHandler } from "./middleware/errors.js";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env["CORS_ORIGIN"] ?? "http://localhost:5173",
      credentials: true,
    })
  );

  // Raw body needed for Stripe webhook signature verification — must come before json()
  app.use(
    "/stripe",
    express.raw({ type: "application/json" }),
    stripeWebhookRouter
  );

  app.use(express.json());
  app.use(morgan("dev"));

  // Health check
  app.get("/health", (_req, res) => res.json({ ok: true }));

  // Routes
  app.use("/auth", authRouter);
  app.use("/workspaces", workspacesRouter);
  app.use("/workspaces/:workspaceSlug/articles", articlesRouter);
  app.use("/workspaces/:workspaceSlug/search", searchRouter);
  app.use("/workspaces/:workspaceSlug/playbooks", playbooksRouter);
  app.use("/workspaces/:workspaceSlug/audit", auditRouter);
  app.use("/workspaces", billingRouter);

  app.use(errorHandler);

  return app;
}
