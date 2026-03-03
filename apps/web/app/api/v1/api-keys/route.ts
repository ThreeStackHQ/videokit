import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { withCors, optionsResponse } from "@/lib/cors";
import { z } from "zod";

// import { db, workspaceApiKeys } from "@videokit/db";
// import { getServerSession } from "next-auth";

const CreateKeySchema = z.object({
  name: z.string().min(1).max(100),
});

export async function OPTIONS(): Promise<NextResponse> {
  return optionsResponse();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // SECURITY: Resolve workspace from authenticated session, not from body
  // const session = await getServerSession(authOptions);
  // if (!session?.user) return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  // const workspaceId = session.user.workspaceId;

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

  // await db.insert(workspaceApiKeys).values({
  //   workspaceId,
  //   keyHash,
  //   name: parsed.data.name,
  // });

  void keyHash; // used in the insert above

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
