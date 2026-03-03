import { NextResponse } from "next/server";
import { db, workspaces, videoPlays, videoGates, videos, users } from "@videokit/db";
import { eq, sql, count, desc } from "drizzle-orm";
import { sendWeeklyDigestEmail } from "@/lib/email";
import { env } from "@/lib/env";

/** POST /api/cron/digest — weekly digest job (protected by CRON_SECRET) */
export async function POST(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("Authorization");
  const expectedSecret = `Bearer ${env.CRON_SECRET}`;

  if (authHeader !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env["NEXTAUTH_URL"] ?? "http://localhost:3000";

  // Date range: last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const period = `${sevenDaysAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  // Fetch all workspaces with digest enabled
  const activeWorkspaces = await db.query.workspaces.findMany({
    where: eq(workspaces.digestEnabled, true),
  });

  let sent = 0;
  let failed = 0;

  for (const workspace of activeWorkspaces) {
    try {
      // Get workspace owner's email
      const user = await db.query.users.findFirst({
        where: eq(users.id, workspace.userId),
      });

      if (!user?.email) continue;

      // Top 5 videos by plays in the last 7 days
      const topVideos = await db
        .select({
          videoId: videoPlays.videoId,
          plays: count(),
          avgCompletion: sql<number>`AVG(${videoPlays.completionRate})`,
        })
        .from(videoPlays)
        .where(sql`${videoPlays.startedAt} >= ${sevenDaysAgo}`)
        .groupBy(videoPlays.videoId)
        .orderBy(desc(count()))
        .limit(5);

      // Get video titles
      const topVideoStats = await Promise.all(
        topVideos.map(async (tv) => {
          const video = await db.query.videos.findFirst({
            where: eq(videos.id, tv.videoId),
          });
          return {
            title: video?.title ?? "Untitled",
            plays: Number(tv.plays),
            completionRate: Number(tv.avgCompletion),
          };
        }),
      );

      // New email captures in the last 7 days
      const [captureCount] = await db
        .select({ total: count() })
        .from(videoGates)
        .innerJoin(videos, eq(videoGates.videoId, videos.id))
        .where(
          sql`${videos.workspaceId} = ${workspace.id} AND ${videoGates.capturedAt} >= ${sevenDaysAgo}`,
        );

      const unsubscribeUrl = `${appUrl}/unsubscribe?token=${workspace.unsubscribeToken ?? ""}`;

      await sendWeeklyDigestEmail({
        to: user.email,
        data: {
          workspaceName: workspace.name,
          topVideos: topVideoStats,
          totalNewCaptures: Number(captureCount?.total ?? 0),
          unsubscribeUrl,
          period,
        },
      });

      sent++;
    } catch (err) {
      console.error(`Digest failed for workspace ${workspace.id}:`, err);
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    period,
  });
}
