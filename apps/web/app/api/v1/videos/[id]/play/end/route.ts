import { NextResponse } from "next/server";
import { z } from "zod";
import { db, videoPlays } from "@videokit/db";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";

interface RouteContext {
  params: { id: string };
}

const EndPlaySchema = z.object({
  playId: z.string().uuid(),
  watchedSeconds: z.number().nonnegative(),
  completionRate: z.number().min(0).max(1),
  ctaShown: z.boolean().optional(),
  ctaClicked: z.boolean().optional(),
});

/** POST /api/v1/videos/[id]/play/end — update play with watch stats */
export async function POST(request: Request, { params: _params }: RouteContext): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`play-end:${ip}`, 200);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body: unknown = await request.json().catch(() => ({}));
  const result = EndPlaySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { playId, watchedSeconds, completionRate, ctaShown, ctaClicked } = result.data;

  await db
    .update(videoPlays)
    .set({
      endedAt: new Date(),
      watchedSeconds,
      completionRate,
      ctaShown: ctaShown ?? false,
      ctaClicked: ctaClicked ?? false,
    })
    .where(eq(videoPlays.id, playId));

  return NextResponse.json({ ok: true });
}
