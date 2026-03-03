import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";
import { optionsResponse, withCors } from "@/lib/cors";
import { resolveWorkspaceFromApiKey } from "@/lib/api-key";
import { db } from "@videokit/db";
import { videoPlays, videos } from "@videokit/db";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

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

  const videoId = req.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return withCors(
      NextResponse.json({ error: "Missing videoId" }, { status: 400 }),
    );
  }

  const plays = await db
    .select()
    .from(videoPlays)
    .innerJoin(videos, eq(videoPlays.videoId, videos.id))
    .where(
      and(
        eq(videos.workspaceId, workspace.id),
        eq(videoPlays.videoId, videoId),
      ),
    );

  const ctaClicks = plays.filter((p) => p.video_plays.ctaClicked).length;

  return withCors(
    NextResponse.json({
      data: {
        videoId,
        totalPlays: plays.length,
        ctaClicks,
        plays: plays.map((p) => p.video_plays),
      },
    }),
  );
}

const CtaClickSchema = z.object({
  videoId: z.string().uuid(),
  viewerId: z.string().optional(),
});

/**
 * POST /api/v1/analytics — record a CTA click event
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body: unknown = await req.json();
  const parsed = CtaClickSchema.safeParse(body);
  if (!parsed.success) {
    return withCors(
      NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 422 },
      ),
    );
  }

  // Insert a play record with ctaClicked=true
  await db.insert(videoPlays).values({
    videoId: parsed.data.videoId,
    viewerId: parsed.data.viewerId ?? "anonymous",
    ctaShown: true,
    ctaClicked: true,
  });

  return withCors(
    NextResponse.json({ message: "CTA click recorded" }, { status: 201 }),
  );
}
