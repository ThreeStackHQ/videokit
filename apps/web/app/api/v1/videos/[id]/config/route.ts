import { NextResponse } from "next/server";
import { db, videos } from "@videokit/db";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";
import { getPresignedDownloadUrl } from "@/lib/r2";

interface RouteContext {
  params: { id: string };
}

/** GET /api/v1/videos/[id]/config — public endpoint for player configuration */
export async function GET(request: Request, { params }: RouteContext): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`config:${ip}`, 200);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const video = await db.query.videos.findFirst({
    where: eq(videos.id, params.id),
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  if (video.status !== "ready") {
    return NextResponse.json({ error: "Video is not ready yet" }, { status: 404 });
  }

  // Generate short-lived presigned URL for the video
  const [videoUrl, thumbnailUrl] = await Promise.all([
    getPresignedDownloadUrl(video.r2Key),
    video.thumbnailR2Key ? getPresignedDownloadUrl(video.thumbnailR2Key) : Promise.resolve(null),
  ]);

  return NextResponse.json({
    id: video.id,
    title: video.title,
    videoUrl,
    thumbnailUrl,
    duration: video.duration,
    settings: video.settings,
    cta: {
      enabled: video.ctaConfig.enabled,
      text: video.ctaConfig.text,
      url: video.ctaConfig.url,
      color: video.ctaConfig.color,
      showAtSeconds: video.ctaConfig.showAtSeconds,
    },
    gate: {
      enabled: video.gateConfig.enabled,
      promptText: video.gateConfig.promptText,
    },
  });
}
