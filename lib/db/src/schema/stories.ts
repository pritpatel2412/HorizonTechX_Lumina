import { pgTable, text, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const storiesTable = pgTable("stories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mediaUrl: text("media_url").notNull().default(""),
  mediaType: text("media_type").notNull().default("text"),
  caption: text("caption").notNull().default(""),
  bgColor: text("bg_color").notNull().default("#7c6aff"),
  textContent: text("text_content").notNull().default(""),
  views: integer("views").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull().default(sql`NOW() + INTERVAL '24 hours'`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const storyViewsTable = pgTable("story_views", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").notNull(),
  viewerId: integer("viewer_id").notNull(),
  viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("story_views_unique").on(t.storyId, t.viewerId),
]);

export const insertStorySchema = createInsertSchema(storiesTable).omit({ id: true, createdAt: true, views: true, expiresAt: true });
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof storiesTable.$inferSelect;
