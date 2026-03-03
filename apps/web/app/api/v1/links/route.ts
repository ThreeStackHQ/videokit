import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";
import { optionsResponse, withCors } from "@/lib/cors";

// import { db, videos } from "@videokit/db";
// import { and, eq } from "drizzle-orm";

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

  // SECURITY: Scope all queries by workspaceId from the authenticated
  // session/API key. Never accept workspaceId from query parameters.
  //
  //   const workspace = await resolveWorkspaceFromApiKey(apiKey);
  //   const videoLinks = await db
  //     .select()
  //     .from(videos)
  //     .where(eq(videos.workspaceId, workspace.id));   // <-- scoped

  return withCors(NextResponse.json({ data: [] }));
}
