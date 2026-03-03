export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, videoGates, videos, workspaces } from "@videokit/db";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";

interface RouteContext {
  params: { id: string };
}

const GateSchema = z.object({
  email: z.string().email().max(254),
});

/** POST /api/v1/videos/[id]/gate — store email capture */
export async function POST(request: Request, { params }: RouteContext): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`gate:${ip}`, 50);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const video = await db.query.videos.findFirst({
    where: eq(videos.id, params.id),
  });

  if (!video || video.status !== "ready") {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  if (!video.gateConfig.enabled) {
    return NextResponse.json({ error: "Email gate is not enabled for this video" }, { status: 409 });
  }

  const body: unknown = await request.json().catch(() => ({}));
  const result = GateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { email } = result.data;

  const [gate] = await db
    .insert(videoGates)
    .values({
      videoId: params.id,
      email,
      capturedAt: new Date(),
    })
    .returning();

  // Send webhook if configured (fire and forget)
  if (video.gateConfig.webhookUrl) {
    const webhookUrl = video.gateConfig.webhookUrl;
    const gateId = gate?.id;

    void (async () => {
      try {
        // Get workspace for metadata
        const workspace = await db.query.workspaces.findFirst({
          where: eq(workspaces.id, video.workspaceId),
        });

        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "gate.email_captured",
            videoId: params.id,
            videoTitle: video.title,
            workspaceId: video.workspaceId,
            workspaceSlug: workspace?.slug,
            email,
            capturedAt: new Date().toISOString(),
          }),
          signal: AbortSignal.timeout(10_000),
        });

        if (response.ok && gateId) {
          await db.update(videoGates).set({ webhookSent: true }).where(eq(videoGates.id, gateId));
        }
      } catch {
        // Webhook failure is non-fatal
      }
    })();
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
