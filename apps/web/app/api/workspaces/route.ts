export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { db, workspaces } from "@videokit/db";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { randomBytes } from "crypto";

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
});

/** POST /api/workspaces — create or return existing workspace */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as typeof session.user & { id: string }).id;

  const existing = await db.query.workspaces.findFirst({
    where: eq(workspaces.userId, userId),
  });
  if (existing) {
    return NextResponse.json({ workspace: existing });
  }

  const body: unknown = await request.json();
  const result = CreateWorkspaceSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { name, slug } = result.data;

  // Check slug uniqueness
  const conflict = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, slug),
  });
  if (conflict) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  const unsubscribeToken = randomBytes(32).toString("hex");
  const [workspace] = await db
    .insert(workspaces)
    .values({ userId, name, slug, plan: "free", unsubscribeToken })
    .returning();

  return NextResponse.json({ workspace }, { status: 201 });
}
