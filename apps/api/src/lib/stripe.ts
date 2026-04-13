import Stripe from "stripe";

if (!process.env["STRIPE_SECRET_KEY"]) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

export const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"], {
  apiVersion: "2024-04-10",
  typescript: true,
});

export const STRIPE_PRO_PRICE_ID = process.env["STRIPE_PRO_PRICE_ID"] ?? "";
export const STRIPE_WEBHOOK_SECRET = process.env["STRIPE_WEBHOOK_SECRET"] ?? "";
