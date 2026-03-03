export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, videoPlays } from "@videokit/db";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";

interface RouteContext {
  params: { id: string };
}

const CtaClickSchema = z.object({
  playId: z.string().uuid(),
});

/** POST /api/v1/videos/[id]/cta-click — log a CTA click event */
export async function POST(request: Request, { params: _params }: RouteContext): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`cta:${ip}`, 200);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body: unknown = await request.json().catch(() => ({}));
  const result = CtaClickSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  await db
    .update(videoPlays)
    .set({ ctaClicked: true, ctaShown: true })
    .where(eq(videoPlays.id, result.data.playId));

  return NextResponse.json({ ok: true });
}
