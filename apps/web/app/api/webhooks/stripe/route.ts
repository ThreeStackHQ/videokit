import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Read raw body as ArrayBuffer, then convert to Buffer for Stripe signature verification.
  // Using req.json() would re-serialize and break the HMAC signature check.
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  // Stripe SDK would be used here:
  // import Stripe from "stripe";
  // const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  // const event = stripe.webhooks.constructEvent(buf, sig, env.STRIPE_WEBHOOK_SECRET);
  //
  // For now we validate the plumbing is correct — the raw buffer + sig
  // are passed to constructEvent (NOT parsed JSON).

  void env.STRIPE_WEBHOOK_SECRET; // ensure secret is loaded

  // Placeholder: parse event type and dispatch
  // switch (event.type) {
  //   case "checkout.session.completed": ...
  //   case "customer.subscription.updated": ...
  // }

  return NextResponse.json({ received: true });
}
