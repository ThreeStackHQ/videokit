import { NextResponse } from "next/server";
import { db, workspaces, subscriptions } from "@videokit/db";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import type Stripe from "stripe";

export const runtime = "nodejs";

/** POST /api/stripe/webhook — Stripe event handler */
export async function POST(request: Request): Promise<NextResponse> {
  const stripe = getStripe();
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(checkoutSession);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook handler error: ${message}`);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const workspaceId = session.metadata?.workspaceId;
  const plan = session.metadata?.plan;

  if (!workspaceId || !plan) return;

  const stripe = getStripe();

  // Fetch subscription details
  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription?.id;

  if (!subscriptionId) return;

  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

  // cancel_at is used as the period end (if set), otherwise null
  const periodEnd = stripeSubscription.cancel_at
    ? new Date(stripeSubscription.cancel_at * 1000)
    : null;

  await db.transaction(async (tx) => {
    // Upsert subscription record
    const existing = await tx.query.subscriptions.findFirst({
      where: eq(subscriptions.workspaceId, workspaceId),
    });

    if (existing) {
      await tx
        .update(subscriptions)
        .set({
          stripeSubscriptionId: subscriptionId,
          plan,
          status: stripeSubscription.status,
          ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.workspaceId, workspaceId));
    } else {
      await tx.insert(subscriptions).values({
        workspaceId,
        stripeSubscriptionId: subscriptionId,
        plan,
        status: stripeSubscription.status,
        ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
      });
    }

    // Upgrade workspace plan
    await tx
      .update(workspaces)
      .set({ plan: plan as "indie" | "pro", updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId));
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const workspaceId = subscription.metadata?.workspaceId;
  if (!workspaceId) return;

  const plan = subscription.metadata?.plan ?? "indie";
  const status = subscription.status;
  const periodEnd = subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null;

  await db.transaction(async (tx) => {
    await tx
      .update(subscriptions)
      .set({
        status,
        plan,
        ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.workspaceId, workspaceId));

    // Update workspace plan based on subscription status
    const newPlan = status === "active" || status === "trialing"
      ? (plan as "indie" | "pro")
      : "free";

    await tx
      .update(workspaces)
      .set({ plan: newPlan, updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId));
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const workspaceId = subscription.metadata?.workspaceId;
  if (!workspaceId) return;

  await db.transaction(async (tx) => {
    await tx
      .update(subscriptions)
      .set({ status: "canceled", updatedAt: new Date() })
      .where(eq(subscriptions.workspaceId, workspaceId));

    // Downgrade to free plan
    await tx
      .update(workspaces)
      .set({ plan: "free", updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId));
  });
}
