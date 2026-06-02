import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savedPostsTable = pgTable("saved_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  postId: integer("post_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("saved_posts_unique").on(t.userId, t.postId),
]);

export const insertSavedPostSchema = createInsertSchema(savedPostsTable).omit({ id: true, createdAt: true });
export type InsertSavedPost = z.infer<typeof insertSavedPostSchema>;
export type SavedPost = typeof savedPostsTable.$inferSelect;
