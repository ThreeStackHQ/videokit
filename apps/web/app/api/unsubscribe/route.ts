export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db, workspaces } from "@videokit/db";
import { eq } from "drizzle-orm";

/** GET /api/unsubscribe?token=... — one-click digest unsubscribe */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.unsubscribeToken, token),
  });

  if (!workspace) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  await db
    .update(workspaces)
    .set({ digestEnabled: false })
    .where(eq(workspaces.id, workspace.id));

  // Redirect to confirmation page
  const appUrl = process.env["NEXTAUTH_URL"] ?? "http://localhost:3000";
  return NextResponse.redirect(`${appUrl}/unsubscribed`);
}
