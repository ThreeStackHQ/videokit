export const dynamic = "force-dynamic";

import { handler } from "@/lib/auth";

// handler is { GET: async fn, POST: async fn } — export each method
export const GET = handler.GET;
export const POST = handler.POST;
