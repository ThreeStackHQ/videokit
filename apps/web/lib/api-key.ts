import { createHash } from "crypto";
import { db, workspaceApiKeys, workspaces } from "@videokit/db";
import { eq } from "drizzle-orm";
import type { Workspace } from "@videokit/db";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function validateApiKey(
  authHeader: string | null,
): Promise<{ workspace: Workspace; keyId: string } | null> {
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  const keyHash = hashApiKey(token);

  const keyRecord = await db.query.workspaceApiKeys.findFirst({
    where: eq(workspaceApiKeys.keyHash, keyHash),
  });

  if (!keyRecord) return null;

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, keyRecord.workspaceId),
  });

  if (!workspace) return null;

  // Update last used (fire and forget)
  void db
    .update(workspaceApiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(workspaceApiKeys.id, keyRecord.id));

  return { workspace, keyId: keyRecord.id };
}
