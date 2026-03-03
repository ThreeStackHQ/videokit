import { pgTable, uuid, text, pgEnum, integer, bigint, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const videoStatusEnum = pgEnum("video_status", ["uploading", "ready"]);

export type VideoSettings = {
  autoplay: boolean;
  loop: boolean;
  primaryColor: string;
  watermark: string | null;
};

export type CtaConfig = {
  enabled: boolean;
  text: string;
  url: string;
  color: string;
  showAtSeconds: number;
};

export type GateConfig = {
  enabled: boolean;
  promptText: string;
  webhookUrl: string | null;
};

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  r2Key: text("r2_key").notNull(),
  thumbnailR2Key: text("thumbnail_r2_key"),
  duration: real("duration"),
  sizeBytes: bigint("size_bytes", { mode: "bigint" }).notNull().default(BigInt(0)),
  status: videoStatusEnum("status").notNull().default("uploading"),
  mimeType: text("mime_type").notNull(),
  settings: jsonb("settings").$type<VideoSettings>().notNull().default({
    autoplay: false,
    loop: false,
    primaryColor: "#3b82f6",
    watermark: null,
  }),
  ctaConfig: jsonb("cta_config").$type<CtaConfig>().notNull().default({
    enabled: false,
    text: "",
    url: "",
    color: "#3b82f6",
    showAtSeconds: 0,
  }),
  gateConfig: jsonb("gate_config").$type<GateConfig>().notNull().default({
    enabled: false,
    promptText: "Enter your email to watch",
    webhookUrl: null,
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
