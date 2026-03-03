import { createHash } from "node:crypto";
import { db } from "@videokit/db";
import { workspaceApiKeys, workspaces } from "@videokit/db";
import { eq } from "drizzle-orm";

export interface ResolvedWorkspace {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "indie" | "pro";
  storageUsedBytes: bigint;
}

/**
 * Resolve a workspace from a plaintext API key.
 * Hashes the key with SHA-256 and looks up the matching workspace.
 */
export async function resolveWorkspaceFromApiKey(
  plaintextKey: string,
): Promise<ResolvedWorkspace | null> {
  const keyHash = createHash("sha256").update(plaintextKey).digest("hex");

  const rows = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      plan: workspaces.plan,
      storageUsedBytes: workspaces.storageUsedBytes,
    })
    .from(workspaceApiKeys)
    .innerJoin(workspaces, eq(workspaceApiKeys.workspaceId, workspaces.id))
    .where(eq(workspaceApiKeys.keyHash, keyHash))
    .limit(1);

  if (rows.length === 0) return null;

  // Update lastUsedAt
  await db
    .update(workspaceApiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(workspaceApiKeys.keyHash, keyHash));

  return rows[0];
}

/** Storage limits per plan in bytes */
export const STORAGE_LIMITS: Record<string, bigint> = {
  free: BigInt(500 * 1024 * 1024),       // 500 MB
  indie: BigInt(2 * 1024 * 1024 * 1024),  // 2 GB
  pro: BigInt(10 * 1024 * 1024 * 1024),   // 10 GB
};
