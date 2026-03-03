import Stripe from "stripe";
import { env } from "./env";

let _stripe: Stripe | undefined;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

export const STRIPE_PLANS = {
  indie: {
    name: "Indie",
    price: 900, // $9.00 in cents
    priceId: process.env["STRIPE_INDIE_PRICE_ID"] ?? "",
    plan: "indie" as const,
  },
  pro: {
    name: "Pro",
    price: 2900, // $29.00 in cents
    priceId: process.env["STRIPE_PRO_PRICE_ID"] ?? "",
    plan: "pro" as const,
  },
} as const;
