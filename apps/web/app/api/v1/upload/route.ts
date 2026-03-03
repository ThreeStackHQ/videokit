import { NextRequest, NextResponse } from "next/server";
import { withCors, optionsResponse } from "@/lib/cors";
import { applyRateLimit } from "@/lib/rate-limit";
import { validateMagicBytes } from "@/lib/magic-bytes";

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

export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiKey = getApiKey(req);
  const ip = getClientIp(req);

  const rateLimited = applyRateLimit(ip, apiKey);
  if (rateLimited) return withCors(rateLimited);

  if (!apiKey) {
    return withCors(
      NextResponse.json({ error: "Missing API key" }, { status: 401 }),
    );
  }

  // Read the uploaded file
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return withCors(
      NextResponse.json({ error: "No file provided" }, { status: 400 }),
    );
  }

  // Read the first 16 bytes to validate magic bytes
  const headerSlice = file.slice(0, 16);
  const header = new Uint8Array(await headerSlice.arrayBuffer());

  const validation = validateMagicBytes(header);
  if (!validation.valid) {
    return withCors(
      NextResponse.json(
        { error: validation.error },
        { status: 415 },
      ),
    );
  }

  // File passed magic bytes check — proceed with R2 upload
  // const workspaceId = ... (from session/API key)
  // const key = `${workspaceId}/${crypto.randomUUID()}.${ext}`;
  // await r2.putObject({ Bucket: env.R2_BUCKET_NAME, Key: key, Body: ... });

  return withCors(
    NextResponse.json(
      { message: "Upload accepted", mime: validation.mime },
      { status: 201 },
    ),
  );
}
