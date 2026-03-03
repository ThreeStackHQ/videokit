import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { withCors, optionsResponse } from "@/lib/cors";
import { applyRateLimit } from "@/lib/rate-limit";
import { validateMagicBytes } from "@/lib/magic-bytes";
import { resolveWorkspaceFromApiKey, STORAGE_LIMITS } from "@/lib/api-key";
import { db } from "@videokit/db";
import { videos, workspaces } from "@videokit/db";
import { eq, sql } from "drizzle-orm";

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

export async function POST(req: NextRequest): Promise<NextResponse> {
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

  // Read the uploaded file
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return withCors(
      NextResponse.json({ error: "No file provided" }, { status: 400 }),
    );
  }

  // Read the first 16 bytes to validate magic bytes
  const headerSlice = file.slice(0, 16);
  const header = new Uint8Array(await headerSlice.arrayBuffer());

  const validation = validateMagicBytes(header);
  if (!validation.valid) {
    return withCors(
      NextResponse.json(
        { error: validation.error },
        { status: 415 },
      ),
    );
  }

  const fileSize = BigInt(file.size);
  const limit = STORAGE_LIMITS[workspace.plan] ?? STORAGE_LIMITS["free"];

  // Check storage limit
  if (workspace.storageUsedBytes + fileSize > limit) {
    return withCors(
      NextResponse.json(
        { error: "Storage limit exceeded", plan: workspace.plan, limitBytes: limit.toString() },
        { status: 413 },
      ),
    );
  }

  const title = formData.get("title")?.toString() ?? "Untitled";
  const r2Key = `${workspace.id}/${randomUUID()}.mp4`;

  // In production, we'd upload to R2 here with a presigned PUT URL.
  // For now, we insert the video record.
  const [video] = await db
    .insert(videos)
    .values({
      workspaceId: workspace.id,
      title,
      r2Key,
      sizeBytes: fileSize,
      mimeType: validation.mime ?? "video/mp4",
      status: "ready",
    })
    .returning();

  // Update workspace counters
  await db
    .update(workspaces)
    .set({
      storageUsedBytes: sql`${workspaces.storageUsedBytes} + ${fileSize}`,
      videosCount: sql`${workspaces.videosCount} + 1`,
    })
    .where(eq(workspaces.id, workspace.id));

  return withCors(
    NextResponse.json(
      {
        message: "Upload accepted",
        mime: validation.mime,
        videoId: video.id,
        r2Key,
      },
      { status: 201 },
    ),
  );
}
