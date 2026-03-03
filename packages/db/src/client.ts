import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

/** Build-safe DB URL: falls back to a placeholder so module can load during `next build`.
 *  Actual queries will fail at runtime if DATABASE_URL is not set — which is correct behaviour. */
const DATABASE_URL =
  process.env["DATABASE_URL"] ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder_build";

const client = postgres(DATABASE_URL, {
  max: 10,
  // Suppress connection errors during build (no actual connections are made at import time)
  connect_timeout: 0,
  idle_timeout: 0,
});

export const db = drizzle(client, { schema });

export type DbClient = typeof db;
