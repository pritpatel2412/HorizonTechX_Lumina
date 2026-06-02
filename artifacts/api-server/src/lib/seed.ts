import bcrypt from "bcryptjs";
import { db, usersTable, postsTable, commentsTable, likesTable, followsTable, storiesTable, notificationsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

export async function seedIfEmpty() {
  const existing = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
  if (existing.length > 0) return;

  logger.info("Seeding database with initial data...");

  const hash = await bcrypt.hash("lumina123", 10);

  const [luna, nova, kai, zara, echo] = await db.insert(usersTable).values([
    {
      username: "luna",
      displayName: "Luna Ray",
      email: "luna@lumina.app",
      passwordHash: hash,
      bio: "digital dreams & neon scenes ✦ photographer & visual storyteller",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
      coverUrl: "https://images.unsplash.com/photo-1518818608552-195ed130cdf4?w=1200&h=400&fit=crop",
      website: "lunaray.co",
      location: "Los Angeles, CA",
      verified: true,
    },
    {
      username: "nova",
      displayName: "Nova Singh",
      email: "nova@lumina.app",
      passwordHash: hash,
      bio: "ui/ux designer obsessed with dark aesthetics and purple everything",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
      coverUrl: "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=1200&h=400&fit=crop",
      website: "novadesign.io",
      location: "New York, NY",
      verified: true,
    },
    {
      username: "kai",
      displayName: "Kai Chen",
      email: "kai@lumina.app",
      passwordHash: hash,
      bio: "building the future one pixel at a time — dev & creative coder",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
      coverUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop",
      website: "kaichen.dev",
      location: "San Francisco, CA",
      verified: false,
    },
    {
      username: "zara",
      displayName: "Zara Mondé",
      email: "zara@lumina.app",
      passwordHash: hash,
      bio: "artist | illustrator | dreamer — creating worlds from color",
      avatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face",
      coverUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&fit=crop",
      website: "zaramonde.art",
      location: "Paris, France",
      verified: true,
    },
    {
      username: "echo",
      displayName: "Echo Wells",
      email: "echo@lumina.app",
      passwordHash: hash,
      bio: "music producer × ambient soundscapes × nocturnal sessions",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face",
      coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=1200&h=400&fit=crop",
      website: "echowells.fm",
      location: "Berlin, Germany",
      verified: false,
    },
  ]).returning();

  await db.insert(followsTable).values([
    { followerId: luna.id, followingId: nova.id },
    { followerId: luna.id, followingId: kai.id },
    { followerId: luna.id, followingId: zara.id },
    { followerId: nova.id, followingId: luna.id },
    { followerId: nova.id, followingId: zara.id },
    { followerId: nova.id, followingId: echo.id },
    { followerId: kai.id, followingId: luna.id },
    { followerId: kai.id, followingId: nova.id },
    { followerId: kai.id, followingId: echo.id },
    { followerId: zara.id, followingId: luna.id },
    { followerId: zara.id, followingId: nova.id },
    { followerId: echo.id, followingId: kai.id },
    { followerId: echo.id, followingId: zara.id },
  ]);

  const [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10] = await db.insert(postsTable).values([
    {
      userId: luna.id,
      content: "Golden hour in the city never gets old. Every sunset feels like the universe painting just for you. #photography #goldenhour #citylife",
      imageUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop",
      postType: "post",
      views: 1240,
    },
    {
      userId: nova.id,
      content: "New design system drop — built entirely around dark aesthetics and electric violet. This one's for the night owls. #design #darkmode #ui",
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
      postType: "post",
      views: 3820,
    },
    {
      userId: kai.id,
      content: "Late night coding session, coffee number three, and finally the bug is fixed. The feeling is unmatched. #coding #developer #buildinginpublic",
      imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop",
      postType: "post",
      views: 892,
    },
    {
      userId: zara.id,
      content: "New piece complete — this one took three weeks but the layers finally came together. Art is patience. #art #illustration #digitalart",
      imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop",
      imageUrl2: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
      postType: "moment",
      views: 5100,
    },
    {
      userId: echo.id,
      content: "Finished the ambient EP at 3am. 47 minutes of pure nocturnal sound design. Dropping next week. #music #ambient #producer",
      imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=600&fit=crop",
      postType: "post",
      views: 2103,
    },
    {
      userId: luna.id,
      content: "Morning light through the fog — captured this before the city woke up. Sometimes the best moments are before the noise. #photography #morning #fog",
      imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&h=600&fit=crop",
      postType: "post",
      views: 2380,
    },
    {
      userId: nova.id,
      content: "Typography exploration for a new brand — mixing Syne with a brutalist grid. The tension between elegant and raw. #typography #branding #design",
      imageUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=600&fit=crop",
      postType: "post",
      views: 1760,
    },
    {
      userId: zara.id,
      content: "Process and final — two stages of the same painting. I love showing the raw and the refined. #art #process #painting",
      imageUrl: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=800&h=600&fit=crop",
      imageUrl2: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop",
      postType: "moment",
      views: 4200,
    },
    {
      userId: kai.id,
      content: "Open sourced my terminal config — over two years of tweaks, aliases, and custom scripts. Link in bio. #opensource #dev #terminal",
      postType: "post",
      views: 1455,
    },
    {
      userId: echo.id,
      content: "Berlin at midnight is a different universe. The architecture, the silence, the electric energy. #berlin #night #travel",
      imageUrl: "https://images.unsplash.com/photo-1559564585-ef9879df4c5d?w=800&h=600&fit=crop",
      postType: "post",
      views: 3900,
    },
  ]).returning();

  await db.insert(likesTable).values([
    { userId: nova.id, postId: p1.id, reactionType: "❤️" },
    { userId: kai.id, postId: p1.id, reactionType: "🔥" },
    { userId: zara.id, postId: p1.id, reactionType: "❤️" },
    { userId: luna.id, postId: p2.id, reactionType: "🔥" },
    { userId: kai.id, postId: p2.id, reactionType: "👏" },
    { userId: echo.id, postId: p2.id, reactionType: "🔥" },
    { userId: zara.id, postId: p3.id, reactionType: "❤️" },
    { userId: luna.id, postId: p4.id, reactionType: "❤️" },
    { userId: nova.id, postId: p4.id, reactionType: "😮" },
    { userId: kai.id, postId: p4.id, reactionType: "🔥" },
    { userId: echo.id, postId: p4.id, reactionType: "❤️" },
    { userId: luna.id, postId: p5.id, reactionType: "❤️" },
    { userId: zara.id, postId: p5.id, reactionType: "🔥" },
    { userId: nova.id, postId: p6.id, reactionType: "❤️" },
    { userId: echo.id, postId: p7.id, reactionType: "👏" },
    { userId: kai.id, postId: p8.id, reactionType: "😮" },
    { userId: luna.id, postId: p8.id, reactionType: "❤️" },
    { userId: nova.id, postId: p10.id, reactionType: "🔥" },
    { userId: luna.id, postId: p10.id, reactionType: "❤️" },
  ]);

  await db.insert(commentsTable).values([
    { postId: p1.id, userId: nova.id, content: "This is absolutely stunning Luna, the way the light hits the buildings is otherworldly" },
    { postId: p1.id, userId: kai.id, content: "What camera setup are you using? The depth of field here is incredible" },
    { postId: p2.id, userId: luna.id, content: "Nova this design system is everything, the violet palette is perfect" },
    { postId: p2.id, userId: echo.id, content: "Dropping this for free? You're too good to us" },
    { postId: p4.id, userId: luna.id, content: "Zara the layers in this piece are insane, three weeks was worth every second" },
    { postId: p4.id, userId: nova.id, content: "The color transition from the first to second shot is chef's kiss" },
    { postId: p5.id, userId: kai.id, content: "Been waiting for this EP. Your ambient work is on another level" },
    { postId: p10.id, userId: nova.id, content: "Berlin calling. Might have to move there for the energy alone" },
  ]);

  await db.insert(storiesTable).values([
    {
      userId: luna.id,
      mediaUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&h=1000&fit=crop",
      mediaType: "image",
      caption: "morning walk",
      bgColor: "#7c6aff",
      expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000),
    },
    {
      userId: nova.id,
      mediaType: "text",
      bgColor: "#0f0f1a",
      textContent: "dark mode is a lifestyle, not just a setting",
      expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000),
    },
    {
      userId: zara.id,
      mediaUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=1000&fit=crop",
      mediaType: "image",
      caption: "WIP",
      bgColor: "#ff6ab0",
      expiresAt: new Date(Date.now() + 15 * 60 * 60 * 1000),
    },
  ]);

  await db.insert(notificationsTable).values([
    { recipientId: luna.id, senderId: nova.id, type: "follow" },
    { recipientId: luna.id, senderId: kai.id, type: "like", postId: p1.id },
    { recipientId: nova.id, senderId: luna.id, type: "like", postId: p2.id },
    { recipientId: zara.id, senderId: luna.id, type: "like", postId: p4.id },
    { recipientId: echo.id, senderId: kai.id, type: "comment", postId: p5.id },
  ]);

  logger.info("Seed complete: 5 users, 10 posts, reactions, comments, stories, notifications");
}
