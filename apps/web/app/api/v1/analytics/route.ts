import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";
import { optionsResponse, withCors } from "@/lib/cors";

// import { db, videoPlays, videos } from "@videokit/db";
// import { and, eq } from "drizzle-orm";
// import { getServerSession } from "next-auth";

function getClientIp(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}

function getApiKey(req: NextRequest): string | null {
  return req.headers.get("authorization")?.replace("Bearer ", "") ?? null;
}

export async function OPTIONS(): Promise<NextResponse> {
  return optionsResponse();
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const apiKey = getApiKey(req);
  const ip = getClientIp(req);

  const rateLimited = applyRateLimit(ip, apiKey);
  if (rateLimited) return withCors(rateLimited);

  if (!apiKey) {
    return withCors(
      NextResponse.json({ error: "Missing API key" }, { status: 401 }),
    );
  }

  // SECURITY: Always scope queries by the authenticated workspace.
  // The workspaceId comes from the verified API key or session — never from
  // user-supplied query params. This prevents cross-workspace IDOR.
  //
  // Example of correct pattern:
  //   const workspace = await resolveWorkspaceFromApiKey(apiKey);
  //   const plays = await db
  //     .select()
  //     .from(videoPlays)
  //     .innerJoin(videos, eq(videoPlays.videoId, videos.id))
  //     .where(and(
  //       eq(videos.workspaceId, workspace.id),     // <-- scoped by auth
  //     ));
  //
  // WRONG pattern (IDOR):
  //   const { workspaceId } = req.nextUrl.searchParams; // <-- user-controlled!
  //   .where(eq(videos.workspaceId, workspaceId))

  const videoId = req.nextUrl.searchParams.get("videoId");
  void videoId; // used after workspace scoping

  return withCors(NextResponse.json({ data: [] }));
}
