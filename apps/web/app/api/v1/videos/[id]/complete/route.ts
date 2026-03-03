import { NextResponse } from "next/server";
import { z } from "zod";
import { db, videos, workspaces } from "@videokit/db";
import { eq, and } from "drizzle-orm";
import { validateApiKey } from "@/lib/api-key";
import { rateLimit } from "@/lib/rate-limit";
import { getR2Client } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

interface RouteContext {
  params: { id: string };
}

const CompleteSchema = z.object({
  sizeBytes: z.number().int().positive(),
  duration: z.number().positive().optional(),
});

/** Magic bytes for common video formats */
const VIDEO_MAGIC = [
  { offset: 0, bytes: [0x00, 0x00, 0x00] }, // MP4/MOV (ftyp box)
  { offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3] }, // WebM/MKV
  { offset: 0, bytes: [0x4f, 0x67, 0x67, 0x53] }, // Ogg
  { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // AVI (RIFF)
];

async function checkIsVideo(r2Key: string): Promise<boolean> {
  try {
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: r2Key,
      Range: "bytes=0-11",
    });
    const response = await client.send(command);
    if (!response.Body) return false;

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks);

    // Check MP4/MOV: bytes 4-7 should contain "ftyp" or "moov" or "free"
    const box4to7 = bytes.subarray(4, 8).toString("ascii");
    if (["ftyp", "moov", "free", "mdat"].includes(box4to7)) return true;

    // Check other formats by magic bytes
    for (const magic of VIDEO_MAGIC.slice(1)) {
      const slice = bytes.subarray(magic.offset, magic.offset + magic.bytes.length);
      if (magic.bytes.every((b, i) => slice[i] === b)) return true;
    }

    return false;
  } catch {
    return false;
  }
}

/** POST /api/v1/videos/[id]/complete — mark video as ready */
export async function POST(request: Request, { params }: RouteContext): Promise<NextResponse> {
  const auth = await validateApiKey(request.headers.get("Authorization"));
  if (!auth) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const rl = rateLimit(`complete:${auth.keyId}`, 100);
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
    return NextResponse.json({ error: "Video is already complete" }, { status: 409 });
  }

  const body: unknown = await request.json();
  const result = CompleteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { sizeBytes, duration } = result.data;

  // Magic bytes validation
  const isVideo = await checkIsVideo(video.r2Key);
  if (!isVideo) {
    return NextResponse.json({ error: "Uploaded file does not appear to be a valid video" }, { status: 422 });
  }

  const [updated] = await db
    .update(videos)
    .set({
      status: "ready",
      sizeBytes: BigInt(sizeBytes),
      duration: duration ?? null,
    })
    .where(eq(videos.id, params.id))
    .returning();

  // Update workspace storage
  await db
    .update(workspaces)
    .set({
      storageUsedBytes: auth.workspace.storageUsedBytes + BigInt(sizeBytes),
    })
    .where(eq(workspaces.id, auth.workspace.id));

  return NextResponse.json({ video: { ...updated, sizeBytes: updated?.sizeBytes.toString() } });
}
