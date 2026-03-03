import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { optionsResponse, withCors } from "@/lib/cors";
import { db } from "@videokit/db";
import { videos, videoGates } from "@videokit/db";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";

const GateSchema = z.object({
  email: z.string().email().max(255),
});

export async function OPTIONS(): Promise<NextResponse> {
  return optionsResponse();
}

/**
 * Submit email to bypass gate on a video.
 * Returns a gate_token that can be used with GET /config?gate_token=...
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const videoId = params.id;

  const body: unknown = await req.json();
  const parsed = GateSchema.safeParse(body);
  if (!parsed.success) {
    return withCors(
      NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 422 },
      ),
    );
  }

  // Verify video exists and has gating enabled
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
  if (!gateConfig.enabled) {
    return withCors(
      NextResponse.json({ error: "Gating not enabled for this video" }, { status: 400 }),
    );
  }

  // Record gate capture
  await db.insert(videoGates).values({
    videoId,
    email: parsed.data.email,
  });

  // Generate a gate bypass token
  const gateToken = randomBytes(32).toString("hex");

  return withCors(
    NextResponse.json(
      { gate_token: gateToken, message: "Gate bypassed" },
      { status: 201 },
    ),
  );
}
