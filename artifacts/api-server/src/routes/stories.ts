import { Router } from "express";
import { db, storiesTable, storyViewsTable } from "@workspace/db";
import { eq, and, gt, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { buildUserSummary } from "../lib/feed";
import { CreateStoryBody, ViewStoryParams, GetStoryViewersParams, DeleteStoryParams } from "@workspace/api-zod";

const router = Router();

// ── Get stories grouped by user ───────────────────────────────────────────────
router.get("/stories", requireAuth, async (req, res): Promise<void> => {
  const uid = req.userId!;

  const result = await db.execute(sql.raw(`
    SELECT s.*,
           u.id AS user_id_u, u.username, u.display_name, u.avatar_url, u.verified, u.bio,
           (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count,
           EXISTS(SELECT 1 FROM follows WHERE follower_id = ${uid} AND following_id = u.id) AS is_following,
           NOT EXISTS(SELECT 1 FROM story_views WHERE story_id = s.id AND viewer_id = ${uid}) AS is_unviewed
    FROM stories s
    JOIN users u ON u.id = s.user_id
    WHERE s.expires_at > NOW()
      AND (s.user_id = ${uid} OR s.user_id IN (SELECT following_id FROM follows WHERE follower_id = ${uid}))
    ORDER BY u.id = ${uid} DESC, s.created_at DESC
  `));

  const groupsMap = new Map<number, {
    user: any;
    stories: any[];
    hasUnviewed: boolean;
  }>();

  for (const row of result.rows as any[]) {
    const userId = Number(row.user_id);
    if (!groupsMap.has(userId)) {
      groupsMap.set(userId, {
        user: buildUserSummary({
          id: row.user_id_u,
          username: row.username,
          display_name: row.display_name,
          avatar_url: row.avatar_url,
          verified: row.verified,
          bio: row.bio,
          is_following: row.is_following,
          follower_count: row.follower_count,
        }),
        stories: [],
        hasUnviewed: false,
      });
    }
    const group = groupsMap.get(userId)!;
    group.stories.push({
      id: Number(row.id),
      userId: Number(row.user_id),
      mediaUrl: row.media_url ?? "",
      mediaType: row.media_type ?? "text",
      caption: row.caption ?? "",
      bgColor: row.bg_color ?? "#7c6aff",
      textContent: row.text_content ?? "",
      views: Number(row.views ?? 0),
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    });
    if (Boolean(row.is_unviewed)) group.hasUnviewed = true;
  }

  res.json(Array.from(groupsMap.values()));
});

// ── Create story ──────────────────────────────────────────────────────────────
router.post("/stories", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateStoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { mediaUrl, mediaType, caption, bgColor, textContent } = parsed.data;

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [story] = await db.insert(storiesTable).values({
    userId: req.userId!,
    mediaUrl: mediaUrl ?? "",
    mediaType: mediaType ?? "text",
    caption: caption ?? "",
    bgColor: bgColor ?? "#7c6aff",
    textContent: textContent ?? "",
    expiresAt,
  }).returning();

  res.status(201).json({
    id: story.id,
    userId: story.userId,
    mediaUrl: story.mediaUrl,
    mediaType: story.mediaType,
    caption: story.caption,
    bgColor: story.bgColor,
    textContent: story.textContent,
    views: story.views,
    expiresAt: story.expiresAt,
    createdAt: story.createdAt,
  });
});

// ── View story ────────────────────────────────────────────────────────────────
router.post("/stories/:id/view", requireAuth, async (req, res): Promise<void> => {
  const params = ViewStoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { id } = params.data;

  await db.insert(storyViewsTable).values({
    storyId: id,
    viewerId: req.userId!,
  }).onConflictDoNothing();

  await db.execute(sql.raw(`UPDATE stories SET views = views + 1 WHERE id = ${id}`));

  const [story] = await db.select({ views: storiesTable.views }).from(storiesTable).where(eq(storiesTable.id, id));
  res.json({ viewCount: story?.views ?? 0 });
});

// ── Get story viewers ─────────────────────────────────────────────────────────
router.get("/stories/:id/viewers", requireAuth, async (req, res): Promise<void> => {
  const params = GetStoryViewersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { id } = params.data;

  const [story] = await db.select({ userId: storiesTable.userId }).from(storiesTable).where(eq(storiesTable.id, id));
  if (!story || story.userId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const result = await db.execute(sql.raw(`
    SELECT u.id, u.username, u.display_name, u.avatar_url, u.verified, u.bio,
           false AS is_following,
           (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count
    FROM story_views sv
    JOIN users u ON u.id = sv.viewer_id
    WHERE sv.story_id = ${id}
    ORDER BY sv.viewed_at DESC
  `));

  res.json((result.rows as any[]).map(buildUserSummary));
});

// ── Delete story ──────────────────────────────────────────────────────────────
router.delete("/stories/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteStoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { id } = params.data;

  const [story] = await db.select({ userId: storiesTable.userId }).from(storiesTable).where(eq(storiesTable.id, id));
  if (!story || story.userId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(storiesTable).where(eq(storiesTable.id, id));
  res.sendStatus(204);
});

export default router;
