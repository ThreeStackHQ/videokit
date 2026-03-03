import { NextResponse } from "next/server";
import { db, videos } from "@videokit/db";
import { eq, and } from "drizzle-orm";
import { validateApiKey } from "@/lib/api-key";
import { rateLimit } from "@/lib/rate-limit";
import { getPresignedUploadUrl } from "@/lib/r2";

interface RouteContext {
  params: { id: string };
}

/** GET /api/v1/videos/[id]/upload-url — return presigned R2 PUT URL */
export async function GET(request: Request, { params }: RouteContext): Promise<NextResponse> {
  const auth = await validateApiKey(request.headers.get("Authorization"));
  if (!auth) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const rl = rateLimit(`upload-url:${auth.keyId}`, 100);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const video = await db.query.videos.findFirst({
    where: and(eq(videos.id, params.id), eq(videos.workspaceId, auth.workspace.id)),
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  if (video.status !== "uploading") {
    return NextResponse.json({ error: "Video is not in uploading state" }, { status: 409 });
  }

  const [uploadUrl, thumbnailUploadUrl] = await Promise.all([
    getPresignedUploadUrl(video.r2Key, video.mimeType),
    video.thumbnailR2Key
      ? getPresignedUploadUrl(video.thumbnailR2Key, "image/jpeg")
      : Promise.resolve(null),
  ]);

  return NextResponse.json({
    uploadUrl,
    thumbnailUploadUrl,
    r2Key: video.r2Key,
    expiresIn: 3600,
  });
}
