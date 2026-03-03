import { NextResponse } from "next/server";
import { db, videoPlays, videoGates, videos } from "@videokit/db";
import { eq, and, sql, count, avg, countDistinct } from "drizzle-orm";
import { validateApiKey } from "@/lib/api-key";
import { rateLimit } from "@/lib/rate-limit";
import { canUseAnalytics } from "@/lib/plan-enforcement";

interface RouteContext {
  params: { id: string };
}

/** GET /api/v1/videos/[id]/analytics — analytics dashboard data */
export async function GET(request: Request, { params }: RouteContext): Promise<NextResponse> {
  const auth = await validateApiKey(request.headers.get("Authorization"));
  if (!auth) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const rl = rateLimit(`analytics:${auth.keyId}`, 100);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  if (!canUseAnalytics(auth.workspace)) {
    return NextResponse.json(
      { error: "Analytics require an Indie or Pro plan. Upgrade to unlock." },
      { status: 403 },
    );
  }

  const video = await db.query.videos.findFirst({
    where: and(eq(videos.id, params.id), eq(videos.workspaceId, auth.workspace.id)),
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  // Aggregate stats
  const [stats] = await db
    .select({
      totalPlays: count(),
      uniqueViewers: countDistinct(videoPlays.viewerId),
      avgWatchSeconds: avg(videoPlays.watchedSeconds),
      avgCompletionRate: avg(videoPlays.completionRate),
      ctaImpressions: sql<number>`SUM(CASE WHEN ${videoPlays.ctaShown} = true THEN 1 ELSE 0 END)`,
      ctaClicks: sql<number>`SUM(CASE WHEN ${videoPlays.ctaClicked} = true THEN 1 ELSE 0 END)`,
    })
    .from(videoPlays)
    .where(eq(videoPlays.videoId, params.id));

  // Email captures
  const [captureStats] = await db
    .select({ total: count() })
    .from(videoGates)
    .where(eq(videoGates.videoId, params.id));

  // Daily plays — last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyPlays = await db
    .select({
      date: sql<string>`DATE(${videoPlays.startedAt})`,
      plays: count(),
    })
    .from(videoPlays)
    .where(and(eq(videoPlays.videoId, params.id), sql`${videoPlays.startedAt} >= ${thirtyDaysAgo}`))
    .groupBy(sql`DATE(${videoPlays.startedAt})`)
    .orderBy(sql`DATE(${videoPlays.startedAt})`);

  return NextResponse.json({
    videoId: params.id,
    title: video.title,
    totalPlays: Number(stats?.totalPlays ?? 0),
    uniqueViewers: Number(stats?.uniqueViewers ?? 0),
    avgWatchSeconds: Number(stats?.avgWatchSeconds ?? 0),
    avgCompletionRate: Number(stats?.avgCompletionRate ?? 0),
    ctaImpressions: Number(stats?.ctaImpressions ?? 0),
    ctaClicks: Number(stats?.ctaClicks ?? 0),
    emailCaptures: Number(captureStats?.total ?? 0),
    dailyPlays: dailyPlays.map((d) => ({ date: d.date, plays: Number(d.plays) })),
  });
}
