import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

function verifyCronSecret(req: NextRequest): boolean {
  const provided = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!provided) return false;

  const expected = env.CRON_SECRET;

  // Constant-time comparison to prevent timing attacks on the secret
  const a = Buffer.from(provided, "utf-8");
  const b = Buffer.from(expected, "utf-8");

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cron job logic: e.g. reset monthly usage counters
  // await db.update(workspaces).set({ videosCount: 0 });

  return NextResponse.json({ ok: true });
}
