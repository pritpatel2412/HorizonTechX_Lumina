import { pgTable, text, serial, integer, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url").notNull().default(""),
  imageUrl2: text("image_url2").notNull().default(""),
  postType: text("post_type").notNull().default("post"),
  views: integer("views").notNull().default(0),
  audience: varchar("audience", { length: 20 }).notNull().default("public"),
  isPinned: boolean("is_pinned").notNull().default(false),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true, createdAt: true, views: true });
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
