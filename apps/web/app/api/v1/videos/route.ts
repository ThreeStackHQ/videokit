import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";

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

export async function GET(req: NextRequest): Promise<NextResponse> {
  const apiKey = getApiKey(req);
  const ip = getClientIp(req);

  // Rate limiting: 30/min per API key, 60/min per IP
  const rateLimited = applyRateLimit(ip, apiKey);
  if (rateLimited) return rateLimited;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  // TODO: validate API key, fetch videos scoped to workspace
  return NextResponse.json({ data: [] });
}
