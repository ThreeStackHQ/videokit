import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db, workspaces } from "@videokit/db";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

/** POST /api/stripe/portal — create a Stripe billing portal session */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as typeof session.user & { id: string }).id;

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.userId, userId),
  });

  if (!workspace?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No active subscription found. Please subscribe first." },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const appUrl = process.env["NEXTAUTH_URL"] ?? "http://localhost:3000";

  let returnUrl: string;
  try {
    const body: unknown = await request.json();
    returnUrl = typeof body === "object" && body !== null && "returnUrl" in body
      ? String((body as { returnUrl: unknown }).returnUrl)
      : `${appUrl}/dashboard/billing`;
  } catch {
    returnUrl = `${appUrl}/dashboard/billing`;
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: workspace.stripeCustomerId,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: portalSession.url });
}
