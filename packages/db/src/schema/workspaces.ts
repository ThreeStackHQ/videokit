import { pgTable, uuid, text, pgEnum, integer, bigint, timestamp } from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan", ["free", "indie", "pro"]);

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: planEnum("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  videosCount: integer("videos_count").notNull().default(0),
  storageUsedBytes: bigint("storage_used_bytes", { mode: "bigint" }).notNull().default(BigInt(0)),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
