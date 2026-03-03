export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, videos, workspaces } from "@videokit/db";
import { eq, desc } from "drizzle-orm";
import { validateApiKey } from "@/lib/api-key";
import { rateLimit } from "@/lib/rate-limit";
import { canUploadVideo } from "@/lib/plan-enforcement";
import { randomUUID } from "crypto";

/** Allowed video MIME types (magic bytes checked on complete) */
const ALLOWED_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
];

const CreateVideoSchema = z.object({
  title: z.string().min(1).max(200),
  mimeType: z.string().refine((v) => ALLOWED_MIME_TYPES.includes(v), {
    message: `mimeType must be one of: ${ALLOWED_MIME_TYPES.join(", ")}`,
  }),
});

/** POST /api/v1/videos — create a new video record */
export async function POST(request: Request): Promise<NextResponse> {
  const auth = await validateApiKey(request.headers.get("Authorization"));
  if (!auth) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const rl = rateLimit(`video:${auth.keyId}`, 100);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  const canUpload = canUploadVideo(auth.workspace);
  if (!canUpload.allowed) {
    return NextResponse.json({ error: canUpload.reason }, { status: 403 });
  }

  const body: unknown = await request.json();
  const result = CreateVideoSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { title, mimeType } = result.data;
  const videoId = randomUUID();
  const r2Key = `videos/${auth.workspace.id}/${videoId}/original`;
  const thumbnailR2Key = `videos/${auth.workspace.id}/${videoId}/thumbnail.jpg`;

  const [video] = await db
    .insert(videos)
    .values({
      id: videoId,
      workspaceId: auth.workspace.id,
      title,
      r2Key,
      thumbnailR2Key,
      mimeType,
      status: "uploading",
    })
    .returning();

  // Increment workspace video count
  await db
    .update(workspaces)
    .set({ videosCount: auth.workspace.videosCount + 1 })
    .where(eq(workspaces.id, auth.workspace.id));

  return NextResponse.json({ video }, { status: 201 });
}

/** GET /api/v1/videos — list workspace videos */
export async function GET(request: Request): Promise<NextResponse> {
  const auth = await validateApiKey(request.headers.get("Authorization"));
  if (!auth) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const rl = rateLimit(`video-list:${auth.keyId}`, 100);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const videoList = await db.query.videos.findMany({
    where: eq(videos.workspaceId, auth.workspace.id),
    orderBy: [desc(videos.createdAt)],
    limit,
    offset,
  });

  return NextResponse.json({
    videos: videoList.map((v) => ({ ...v, sizeBytes: v.sizeBytes.toString() })),
    limit,
    offset,
  });
}
