import { NextResponse } from "next/server";
import { z } from "zod";
import { db, videoPlays, videos } from "@videokit/db";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";

interface RouteContext {
  params: { id: string };
}

const PlaySchema = z.object({
  viewerId: z.string().min(1).max(128).optional(),
});

/** POST /api/v1/videos/[id]/play — log a play event */
export async function POST(request: Request, { params }: RouteContext): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`play:${ip}`, 200);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const video = await db.query.videos.findFirst({
    where: eq(videos.id, params.id),
  });

  if (!video || video.status !== "ready") {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const body: unknown = await request.json().catch(() => ({}));
  const result = PlaySchema.safeParse(body);
  const viewerId = result.success ? (result.data.viewerId ?? null) : null;

  const [play] = await db
    .insert(videoPlays)
    .values({
      videoId: params.id,
      viewerId,
      startedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ playId: play?.id }, { status: 201 });
}
