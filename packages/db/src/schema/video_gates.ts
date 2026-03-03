import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { videos } from "./videos";

export const videoGates = pgTable("video_gates", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: uuid("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  webhookSent: boolean("webhook_sent").notNull().default(false),
});

export type VideoGate = typeof videoGates.$inferSelect;
export type NewVideoGate = typeof videoGates.$inferInsert;
