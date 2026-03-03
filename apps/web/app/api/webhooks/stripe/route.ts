import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@videokit/db";
import { workspaces, subscriptions } from "@videokit/db";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

/**
 * Simplified Stripe signature verification.
 * In production, use stripe.webhooks.constructEvent().
 */
function verifySignature(payload: Buffer, sig: string, secret: string): boolean {
  // Stripe sends: t=<timestamp>,v1=<sig>
  const parts = sig.split(",");
  const tsPart = parts.find((p) => p.startsWith("t="));
  const sigPart = parts.find((p) => p.startsWith("v1="));
  if (!tsPart || !sigPart) return false;

  const timestamp = tsPart.slice(2);
  const signature = sigPart.slice(3);

  const signedPayload = `${timestamp}.${payload.toString("utf-8")}`;
  const expected = createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  const valid = verifySignature(buf, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 },
    );
  }

  const event = JSON.parse(buf.toString("utf-8")) as StripeEvent;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const customerId = session["customer"] as string;
      const subscriptionId = session["subscription"] as string;
      const plan = (session["metadata"] as Record<string, string>)?.["plan"] ?? "indie";

      // Update workspace plan
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.stripeCustomerId, customerId))
        .limit(1);

      if (workspace) {
        await db
          .update(workspaces)
          .set({ plan: plan as "free" | "indie" | "pro" })
          .where(eq(workspaces.id, workspace.id));

        await db.insert(subscriptions).values({
          workspaceId: workspace.id,
          stripeSubscriptionId: subscriptionId,
          plan,
          status: "active",
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
