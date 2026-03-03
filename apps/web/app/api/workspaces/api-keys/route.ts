export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { db, workspaces, workspaceApiKeys } from "@videokit/db";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { hashApiKey } from "@/lib/api-key";
import { randomBytes } from "crypto";

const CreateKeySchema = z.object({
  name: z.string().min(1).max(100),
});

/** POST /api/workspaces/api-keys — create API key */
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
  const result = CreateKeySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const rawKey = `vk_${randomBytes(32).toString("hex")}`;
  const keyHash = hashApiKey(rawKey);

  const [keyRecord] = await db
    .insert(workspaceApiKeys)
    .values({
      workspaceId: workspace.id,
      keyHash,
      name: result.data.name,
    })
    .returning();

  // Return the raw key ONCE — we never store it
  return NextResponse.json(
    {
      id: keyRecord?.id,
      name: keyRecord?.name,
      key: rawKey, // Only returned on creation
      createdAt: keyRecord?.createdAt,
    },
    { status: 201 },
  );
}

/** GET /api/workspaces/api-keys — list API keys (without secret values) */
export async function GET(): Promise<NextResponse> {
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

  const keys = await db.query.workspaceApiKeys.findMany({
    where: eq(workspaceApiKeys.workspaceId, workspace.id),
    columns: { keyHash: false }, // Never expose the hash
  });

  return NextResponse.json({ keys });
}
