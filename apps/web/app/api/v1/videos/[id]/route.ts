export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, videos, workspaces } from "@videokit/db";
import { eq, and } from "drizzle-orm";
import { validateApiKey } from "@/lib/api-key";
import { rateLimit } from "@/lib/rate-limit";
import { deleteFromR2 } from "@/lib/r2";
import { canUseCTA, canUseGate } from "@/lib/plan-enforcement";

interface RouteContext {
  params: { id: string };
}

const UpdateVideoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  settings: z
    .object({
      autoplay: z.boolean().optional(),
      loop: z.boolean().optional(),
      primaryColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
        .optional(),
      watermark: z.string().url().nullable().optional(),
    })
    .optional(),
  ctaConfig: z
    .object({
      enabled: z.boolean().optional(),
      text: z.string().max(100).optional(),
      url: z.string().url().optional(),
      color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
      showAtSeconds: z.number().nonnegative().optional(),
    })
    .optional(),
  gateConfig: z
    .object({
      enabled: z.boolean().optional(),
      promptText: z.string().max(200).optional(),
      webhookUrl: z.string().url().nullable().optional(),
    })
    .optional(),
});

/** PATCH /api/v1/videos/[id] — update video settings */
export async function PATCH(request: Request, { params }: RouteContext): Promise<NextResponse> {
  const auth = await validateApiKey(request.headers.get("Authorization"));
  if (!auth) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const rl = rateLimit(`patch-video:${auth.keyId}`, 100);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const video = await db.query.videos.findFirst({
    where: and(eq(videos.id, params.id), eq(videos.workspaceId, auth.workspace.id)),
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const body: unknown = await request.json();
  const result = UpdateVideoSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const updates = result.data;

  // Plan enforcement: check CTA access
  if (updates.ctaConfig?.enabled && !canUseCTA(auth.workspace)) {
    return NextResponse.json(
      { error: "CTA overlays require an Indie or Pro plan. Upgrade to unlock." },
      { status: 403 },
    );
  }

  // Plan enforcement: check gate access
  if (updates.gateConfig?.enabled && !canUseGate(auth.workspace)) {
    return NextResponse.json(
      { error: "Email gates require an Indie or Pro plan. Upgrade to unlock." },
      { status: 403 },
    );
  }

  const updatedSettings = updates.settings
    ? {
        autoplay: updates.settings.autoplay ?? video.settings.autoplay,
        loop: updates.settings.loop ?? video.settings.loop,
        primaryColor: updates.settings.primaryColor ?? video.settings.primaryColor,
        watermark: updates.settings.watermark !== undefined ? updates.settings.watermark : video.settings.watermark,
      }
    : video.settings;

  const updatedCta = updates.ctaConfig
    ? {
        enabled: updates.ctaConfig.enabled ?? video.ctaConfig.enabled,
        text: updates.ctaConfig.text ?? video.ctaConfig.text,
        url: updates.ctaConfig.url ?? video.ctaConfig.url,
        color: updates.ctaConfig.color ?? video.ctaConfig.color,
        showAtSeconds: updates.ctaConfig.showAtSeconds ?? video.ctaConfig.showAtSeconds,
      }
    : video.ctaConfig;

  const updatedGate = updates.gateConfig
    ? {
        enabled: updates.gateConfig.enabled ?? video.gateConfig.enabled,
        promptText: updates.gateConfig.promptText ?? video.gateConfig.promptText,
        webhookUrl: updates.gateConfig.webhookUrl !== undefined ? updates.gateConfig.webhookUrl : video.gateConfig.webhookUrl,
      }
    : video.gateConfig;

  const [updated] = await db
    .update(videos)
    .set({
      title: updates.title ?? video.title,
      settings: updatedSettings,
      ctaConfig: updatedCta,
      gateConfig: updatedGate,
    })
    .where(eq(videos.id, params.id))
    .returning();

  return NextResponse.json({ video: { ...updated, sizeBytes: updated?.sizeBytes.toString() } });
}

/** DELETE /api/v1/videos/[id] — delete video from R2 + DB */
export async function DELETE(request: Request, { params }: RouteContext): Promise<NextResponse> {
  const auth = await validateApiKey(request.headers.get("Authorization"));
  if (!auth) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const rl = rateLimit(`delete-video:${auth.keyId}`, 100);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const video = await db.query.videos.findFirst({
    where: and(eq(videos.id, params.id), eq(videos.workspaceId, auth.workspace.id)),
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  // Delete from R2 (fire and wait)
  await Promise.allSettled([
    deleteFromR2(video.r2Key),
    video.thumbnailR2Key ? deleteFromR2(video.thumbnailR2Key) : Promise.resolve(),
  ]);

  // Delete from DB
  await db.delete(videos).where(eq(videos.id, params.id));

  // Update workspace storage and video count
  const newStorage =
    auth.workspace.storageUsedBytes > video.sizeBytes
      ? auth.workspace.storageUsedBytes - video.sizeBytes
      : BigInt(0);

  await db
    .update(workspaces)
    .set({
      storageUsedBytes: newStorage,
      videosCount: Math.max(0, auth.workspace.videosCount - 1),
    })
    .where(eq(workspaces.id, auth.workspace.id));

  return new NextResponse(null, { status: 204 });
}
