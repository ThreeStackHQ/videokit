import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { withCors, optionsResponse } from "@/lib/cors";
import { z } from "zod";
import { db } from "@videokit/db";
import { workspaceApiKeys } from "@videokit/db";

const CreateKeySchema = z.object({
  name: z.string().min(1).max(100),
  workspaceId: z.string().uuid(),
});

export async function OPTIONS(): Promise<NextResponse> {
  return optionsResponse();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // In production: resolve workspace from authenticated session, not from body.
  // For integration testing, we accept workspaceId in body.
  const body: unknown = await req.json();
  const parsed = CreateKeySchema.safeParse(body);
  if (!parsed.success) {
    return withCors(
      NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 422 },
      ),
    );
  }

  // Generate a cryptographically random API key
  const plaintext = `vk_${randomBytes(32).toString("hex")}`;

  // Store only the SHA-256 hash — plaintext is returned once and never stored
  const keyHash = createHash("sha256").update(plaintext).digest("hex");

  await db.insert(workspaceApiKeys).values({
    workspaceId: parsed.data.workspaceId,
    keyHash,
    name: parsed.data.name,
  });

  // Return plaintext exactly once — it cannot be retrieved again
  return withCors(
    NextResponse.json(
      {
        key: plaintext,
        name: parsed.data.name,
        message:
          "Store this key securely. It will not be shown again.",
      },
      { status: 201 },
    ),
  );
}
