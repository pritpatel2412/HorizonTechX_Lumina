import { pgTable, text, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const likesTable = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  postId: integer("post_id"),
  commentId: integer("comment_id"),
  reactionType: text("reaction_type").notNull().default("❤️"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("likes_user_post_unique").on(t.userId, t.postId),
  unique("likes_user_comment_unique").on(t.userId, t.commentId),
]);

export const insertLikeSchema = createInsertSchema(likesTable).omit({ id: true, createdAt: true });
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likesTable.$inferSelect;
