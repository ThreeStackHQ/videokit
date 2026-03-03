export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { db, workspaces } from "@videokit/db";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { getStripe, STRIPE_PLANS } from "@/lib/stripe";

const CheckoutSchema = z.object({
  plan: z.enum(["indie", "pro"]),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

/** POST /api/stripe/checkout — create a Stripe checkout session */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as typeof session.user & { id: string }).id;

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.userId, userId),
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const body: unknown = await request.json();
  const result = CheckoutSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { plan, successUrl, cancelUrl } = result.data;
  const planConfig = STRIPE_PLANS[plan];
  const stripe = getStripe();

  const appUrl = process.env["NEXTAUTH_URL"] ?? "http://localhost:3000";

  // Create or retrieve Stripe customer
  let customerId = workspace.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      ...(session.user.email ? { email: session.user.email } : {}),
      ...(session.user.name ? { name: session.user.name } : {}),
      metadata: { workspaceId: workspace.id, userId },
    });
    customerId = customer.id;
    await db.update(workspaces).set({ stripeCustomerId: customerId }).where(eq(workspaces.id, workspace.id));
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: successUrl ?? `${appUrl}/dashboard?upgraded=true`,
    cancel_url: cancelUrl ?? `${appUrl}/dashboard/billing`,
    metadata: {
      workspaceId: workspace.id,
      plan,
    },
    subscription_data: {
      metadata: {
        workspaceId: workspace.id,
        plan,
      },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
