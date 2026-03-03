import { pgTable, uuid, text, timestamp, real, boolean, integer } from "drizzle-orm/pg-core";
import { videos } from "./videos";

export const videoPlays = pgTable("video_plays", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: uuid("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  viewerId: text("viewer_id"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  watchedSeconds: real("watched_seconds").notNull().default(0),
  completionRate: real("completion_rate").notNull().default(0),
  ctaShown: boolean("cta_shown").notNull().default(false),
  ctaClicked: boolean("cta_clicked").notNull().default(false),
});

export type VideoPlay = typeof videoPlays.$inferSelect;
export type NewVideoPlay = typeof videoPlays.$inferInsert;
