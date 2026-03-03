import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";
import { optionsResponse, withCors } from "@/lib/cors";
import { resolveWorkspaceFromApiKey, STORAGE_LIMITS } from "@/lib/api-key";
import { db } from "@videokit/db";
import { videos, workspaces } from "@videokit/db";
import { eq, and, isNull, sql } from "drizzle-orm";

function getClientIp(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}

function getApiKey(req: NextRequest): string | null {
  return req.headers.get("authorization")?.replace("Bearer ", "") ?? null;
}

export async function OPTIONS(): Promise<NextResponse> {
  return optionsResponse();
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const apiKey = getApiKey(req);
  const ip = getClientIp(req);

  const rateLimited = applyRateLimit(ip, apiKey);
  if (rateLimited) return withCors(rateLimited);

  if (!apiKey) {
    return withCors(
      NextResponse.json({ error: "Missing API key" }, { status: 401 }),
    );
  }

  const workspace = await resolveWorkspaceFromApiKey(apiKey);
  if (!workspace) {
    return withCors(
      NextResponse.json({ error: "Invalid API key" }, { status: 401 }),
    );
  }

  // Fetch videos scoped to workspace, excluding soft-deleted
  const rows = await db
    .select()
    .from(videos)
    .where(
      and(
        eq(videos.workspaceId, workspace.id),
        isNull(videos.deletedAt),
      ),
    );

  // Serialize BigInt fields to string for JSON compatibility
  const serialized = rows.map((row) => ({
    ...row,
    sizeBytes: row.sizeBytes.toString(),
  }));

  return withCors(NextResponse.json({ data: serialized }));
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const apiKey = getApiKey(req);
  const ip = getClientIp(req);

  const rateLimited = applyRateLimit(ip, apiKey);
  if (rateLimited) return withCors(rateLimited);

  if (!apiKey) {
    return withCors(
      NextResponse.json({ error: "Missing API key" }, { status: 401 }),
    );
  }

  const workspace = await resolveWorkspaceFromApiKey(apiKey);
  if (!workspace) {
    return withCors(
      NextResponse.json({ error: "Invalid API key" }, { status: 401 }),
    );
  }

  const videoId = req.nextUrl.searchParams.get("id");
  if (!videoId) {
    return withCors(
      NextResponse.json({ error: "Missing video id" }, { status: 400 }),
    );
  }

  // Find the video (must belong to workspace and not already deleted)
  const [video] = await db
    .select()
    .from(videos)
    .where(
      and(
        eq(videos.id, videoId),
        eq(videos.workspaceId, workspace.id),
        isNull(videos.deletedAt),
      ),
    )
    .limit(1);

  if (!video) {
    return withCors(
      NextResponse.json({ error: "Video not found" }, { status: 404 }),
    );
  }

  // Soft-delete: set deletedAt, schedule R2 deletion
  await db
    .update(videos)
    .set({ deletedAt: new Date(), r2DeletionScheduled: true })
    .where(eq(videos.id, videoId));

  // Decrement storage counter on workspace
  await db
    .update(workspaces)
    .set({
      storageUsedBytes: sql`GREATEST(0, ${workspaces.storageUsedBytes} - ${video.sizeBytes})`,
      videosCount: sql`GREATEST(0, ${workspaces.videosCount} - 1)`,
    })
    .where(eq(workspaces.id, workspace.id));

  return withCors(new NextResponse(null, { status: 204 }));
}
