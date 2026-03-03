export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db, workspaces, videos } from "@videokit/db";
import { eq, count, sum } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { PLAN_LIMITS } from "@/lib/plan-enforcement";

/** GET /api/workspaces/me — current workspace with plan + usage stats */
export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as typeof session.user & { id: string }).id;

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.userId, userId),
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // Compute live usage stats
  const [videoCountResult] = await db
    .select({ count: count() })
    .from(videos)
    .where(eq(videos.workspaceId, workspace.id));

  const [storageResult] = await db
    .select({ total: sum(videos.sizeBytes) })
    .from(videos)
    .where(eq(videos.workspaceId, workspace.id));

  const limits = PLAN_LIMITS[workspace.plan];

  return NextResponse.json({
    workspace: {
      ...workspace,
      storageUsedBytes: workspace.storageUsedBytes.toString(),
    },
    usage: {
      videosCount: videoCountResult?.count ?? 0,
      storageUsedBytes: storageResult?.total?.toString() ?? "0",
      limits: {
        maxVideos: limits.maxVideos,
        maxStorageBytes: limits.maxStorageBytes === BigInt(-1) ? null : limits.maxStorageBytes.toString(),
        hasCTA: limits.hasCTA,
        hasGate: limits.hasGate,
        hasAnalytics: limits.hasAnalytics,
      },
    },
  });
}
