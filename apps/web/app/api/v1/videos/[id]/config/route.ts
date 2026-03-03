import { NextRequest, NextResponse } from "next/server";
import { optionsResponse, withCors } from "@/lib/cors";
import { db } from "@videokit/db";
import { videos } from "@videokit/db";
import { eq, and, isNull } from "drizzle-orm";

export async function OPTIONS(): Promise<NextResponse> {
  return optionsResponse();
}

/**
 * Public endpoint — returns player configuration for a video.
 * If gating is enabled and no valid gate token is provided, returns gated response.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const videoId = params.id;
  const gateToken = req.nextUrl.searchParams.get("gate_token");

  const [video] = await db
    .select()
    .from(videos)
    .where(and(eq(videos.id, videoId), isNull(videos.deletedAt)))
    .limit(1);

  if (!video) {
    return withCors(
      NextResponse.json({ error: "Video not found" }, { status: 404 }),
    );
  }

  const gateConfig = video.gateConfig as { enabled: boolean; promptText: string; webhookUrl: string | null };
  const ctaConfig = video.ctaConfig as { enabled: boolean; text: string; url: string; color: string; showAtSeconds: number };
  const settings = video.settings as { autoplay: boolean; loop: boolean; primaryColor: string; watermark: string | null };

  // If gating is enabled and no valid token provided, return gated response
  if (gateConfig.enabled && !gateToken) {
    return withCors(
      NextResponse.json({
        data: {
          id: video.id,
          title: video.title,
          gated: true,
          gatePromptText: gateConfig.promptText,
          settings,
        },
      }),
    );
  }

  // Full config (gate bypassed or gating not enabled)
  return withCors(
    NextResponse.json({
      data: {
        id: video.id,
        title: video.title,
        gated: false,
        r2Key: video.r2Key,
        duration: video.duration,
        mimeType: video.mimeType,
        settings,
        ctaConfig: ctaConfig.enabled
          ? {
              ctaText: ctaConfig.text,
              ctaUrl: ctaConfig.url,
              ctaColor: ctaConfig.color,
              ctaTimestamp: ctaConfig.showAtSeconds,
            }
          : null,
      },
    }),
  );
}
