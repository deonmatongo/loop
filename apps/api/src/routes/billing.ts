import { Router, type Router as ExpressRouter } from "express";
import type { Request } from "express";
import { prisma } from "@loop/db";
import { stripe, STRIPE_PRO_PRICE_ID, STRIPE_WEBHOOK_SECRET } from "../lib/stripe.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireMember } from "../middleware/requireMember.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../middleware/errors.js";
import { writeAuditLog } from "../lib/audit.js";

export const billingRouter: ExpressRouter = Router({ mergeParams: true });

// Create a Stripe Checkout session → upgrades workspace to PRO
billingRouter.post(
  "/:workspaceSlug/billing/checkout",
  requireAuth,
  requireMember,
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const workspace = req.workspace!;
    const returnUrl = `${process.env["CORS_ORIGIN"]}/${workspace.slug}/settings/billing`;

    let customerId = workspace.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user!.email,
        name: workspace.name,
        metadata: { workspaceId: workspace.id },
      });
      customerId = customer.id;
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: STRIPE_PRO_PRICE_ID, quantity: 1 }],
      success_url: `${returnUrl}?success=true`,
      cancel_url: `${returnUrl}?canceled=true`,
    });

    res.json({ url: session.url });
  })
);

// Customer portal — manage/cancel subscription
billingRouter.post(
  "/:workspaceSlug/billing/portal",
  requireAuth,
  requireMember,
  requireRole("OWNER"),
  asyncHandler(async (req, res) => {
    const workspace = req.workspace!;

    if (!workspace.stripeCustomerId) {
      res.status(400).json({ error: "No billing account" });
      return;
    }

    const returnUrl = `${process.env["CORS_ORIGIN"]}/${workspace.slug}/settings/billing`;
    const session = await stripe.billingPortal.sessions.create({
      customer: workspace.stripeCustomerId,
      return_url: returnUrl,
    });

    res.json({ url: session.url });
  })
);

// Stripe webhook — must use raw body for signature verification
export const stripeWebhookRouter: ExpressRouter = Router();

stripeWebhookRouter.post(
  "/webhook",
  asyncHandler(async (req: Request & { rawBody?: Buffer }, res) => {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      res.status(400).json({ error: "Missing signature" });
      return;
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody ?? req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch {
      res.status(400).json({ error: "Webhook signature verification failed" });
      return;
    }

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const workspace = await prisma.workspace.findFirst({
          where: { stripeCustomerId: sub.customer as string },
        });
        if (workspace) {
          const plan = sub.status === "active" ? "PRO" : "FREE";
          await prisma.workspace.update({
            where: { id: workspace.id },
            data: { plan, stripeSubscriptionId: sub.id },
          });
          await writeAuditLog({
            workspaceId: workspace.id,
            action: `billing.plan_changed`,
            resourceType: "workspace",
            resourceId: workspace.id,
            metadata: { plan, subscriptionStatus: sub.status },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const workspace = await prisma.workspace.findFirst({
          where: { stripeCustomerId: sub.customer as string },
        });
        if (workspace) {
          await prisma.workspace.update({
            where: { id: workspace.id },
            data: { plan: "FREE", stripeSubscriptionId: null },
          });
        }
        break;
      }
    }

    res.json({ received: true });
  })
);
