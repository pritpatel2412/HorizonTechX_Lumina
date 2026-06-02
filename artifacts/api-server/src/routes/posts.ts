import { Router } from "express";
import { db, postsTable, likesTable, commentsTable, savedPostsTable, notificationsTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../lib/auth";
import { buildFeedQuery, buildFeedPost, buildComment } from "../lib/feed";
import {
  GetPostParams, DeletePostParams,
  CreatePostBody, TogglePostLikeParams, TogglePostLikeBody,
  TogglePostSaveParams, GetPostCommentsParams, CreateCommentParams,
  CreateCommentBody, DeleteCommentParams, ToggleCommentLikeParams,
  GetFeedQueryParams, GetExplorePostsQueryParams, GetSavedPostsQueryParams,
} from "@workspace/api-zod";

const router = Router();

// ── Feed ──────────────────────────────────────────────────────────────────────
router.get("/posts/feed", requireAuth, async (req, res): Promise<void> => {
  const q = GetFeedQueryParams.safeParse(req.query);
  const offset = q.success ? (q.data.offset ?? 0) : 0;
  const limit = q.success ? (q.data.limit ?? 10) : 10;
  const uid = req.userId!;

  const posts = await buildFeedQuery({
    where: `(p.user_id = ${uid} OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ${uid})) AND (p.scheduled_at IS NULL OR p.scheduled_at <= NOW())`,
    currentUserId: uid,
    limit,
    offset,
  });

  res.json(posts);
});

// ── Explore ───────────────────────────────────────────────────────────────────
router.get("/posts/explore", optionalAuth, async (req, res): Promise<void> => {
  const q = GetExplorePostsQueryParams.safeParse(req.query);
  const offset = q.success ? (q.data.offset ?? 0) : 0;
  const limit = q.success ? (q.data.limit ?? 20) : 20;
  const tag = q.success ? q.data.tag : null;
  const uid = req.userId ?? null;

  const tagCondition = tag ? `AND p.content ILIKE '%#${tag}%'` : "";

  const posts = await buildFeedQuery({
    where: `p.id IN (
      SELECT l.post_id FROM likes l WHERE l.post_id IS NOT NULL AND l.created_at >= NOW() - INTERVAL '7 days' GROUP BY l.post_id
    ) ${tagCondition} AND (p.scheduled_at IS NULL OR p.scheduled_at <= NOW())`,
    currentUserId: uid,
    limit,
    offset,
    orderBy: "(SELECT COUNT(*) FROM likes WHERE post_id = p.id) DESC, p.created_at DESC",
  });

  if (posts.length < limit) {
    const extraOffset = Math.max(0, offset - 100);
    const extra = await buildFeedQuery({
      where: `p.id NOT IN (${posts.map(p => p.id).join(",") || "0"}) ${tagCondition} AND (p.scheduled_at IS NULL OR p.scheduled_at <= NOW())`,
      currentUserId: uid,
      limit: limit - posts.length,
      offset: extraOffset,
      orderBy: "p.created_at DESC",
    });
    posts.push(...extra);
  }

  res.json(posts);
});

// ── Saved posts ───────────────────────────────────────────────────────────────
router.get("/posts/saved", requireAuth, async (req, res): Promise<void> => {
  const q = GetSavedPostsQueryParams.safeParse(req.query);
  const offset = q.success ? (q.data.offset ?? 0) : 0;
  const limit = q.success ? (q.data.limit ?? 20) : 20;
  const uid = req.userId!;

  const posts = await buildFeedQuery({
    where: `p.id IN (SELECT post_id FROM saved_posts WHERE user_id = ${uid})`,
    currentUserId: uid,
    limit,
    offset,
    orderBy: `(SELECT created_at FROM saved_posts WHERE user_id = ${uid} AND post_id = p.id) DESC`,
  });

  res.json(posts);
});

// ── Trending tags ─────────────────────────────────────────────────────────────
router.get("/posts/trending-tags", async (_req, res): Promise<void> => {
  const result = await db.execute(sql.raw(`
    SELECT tag, COUNT(*) AS count
    FROM (
      SELECT LOWER(REGEXP_REPLACE(UNNEST(REGEXP_MATCHES(content, '#([a-zA-Z0-9_]+)', 'g')), '^#', '')) AS tag
      FROM posts WHERE created_at >= NOW() - INTERVAL '7 days'
    ) t
    GROUP BY tag
    ORDER BY count DESC
    LIMIT 10
  `));
  res.json((result.rows as any[]).map(r => ({ tag: r.tag, count: Number(r.count) })));
});

// ── Create post ───────────────────────────────────────────────────────────────
router.post("/posts", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { content, imageUrl, imageUrl2, postType, scheduledAt } = parsed.data;

  const [post] = await db.insert(postsTable).values({
    userId: req.userId!,
    content,
    imageUrl: imageUrl ?? "",
    imageUrl2: imageUrl2 ?? "",
    postType: postType ?? "post",
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
  }).returning();

  const posts = await buildFeedQuery({
    where: `p.id = ${post.id}`,
    currentUserId: req.userId!,
    limit: 1,
    offset: 0,
  });

  res.status(201).json(posts[0]);
});

// ── Get single post ───────────────────────────────────────────────────────────
router.get("/posts/:id", optionalAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid post id" });
    return;
  }

  const posts = await buildFeedQuery({
    where: `p.id = ${id}`,
    currentUserId: req.userId ?? null,
    limit: 1,
    offset: 0,
  });

  if (posts.length === 0) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const comments = await db.execute(sql.raw(`
    SELECT c.id, c.post_id, c.content, c.parent_comment_id, c.created_at,
           u.id AS author_id, u.username AS author_username, u.display_name AS author_display_name,
           u.avatar_url AS author_avatar_url, u.verified AS author_verified, u.bio AS author_bio,
           COALESCE(lc.cnt, 0) AS like_count,
           ${req.userId ? `EXISTS(SELECT 1 FROM likes WHERE user_id = ${req.userId} AND comment_id = c.id)` : "false"} AS liked
    FROM comments c
    JOIN users u ON u.id = c.user_id
    LEFT JOIN (SELECT comment_id, COUNT(*) AS cnt FROM likes WHERE comment_id IS NOT NULL GROUP BY comment_id) lc ON lc.comment_id = c.id
    WHERE c.post_id = ${id}
    ORDER BY c.created_at ASC
  `));

  res.json({ ...posts[0], comments: (comments.rows as any[]).map(buildComment) });
});

// ── Delete post ───────────────────────────────────────────────────────────────
router.delete("/posts/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeletePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { id } = params.data;

  const [post] = await db.select({ userId: postsTable.userId }).from(postsTable).where(eq(postsTable.id, id));
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  if (post.userId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(postsTable).where(eq(postsTable.id, id));
  res.sendStatus(204);
});

// ── Toggle post like ──────────────────────────────────────────────────────────
router.post("/posts/:id/like", requireAuth, async (req, res): Promise<void> => {
  const params = TogglePostLikeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { id } = params.data;
  const bodyParsed = TogglePostLikeBody.safeParse(req.body ?? {});
  const reaction = bodyParsed.success ? (bodyParsed.data.reaction ?? "❤️") : "❤️";

  const existing = await db.select().from(likesTable)
    .where(and(eq(likesTable.userId, req.userId!), eq(likesTable.postId, id)));

  let liked: boolean;
  if (existing.length > 0) {
    if (reaction && existing[0].reactionType === reaction) {
      await db.delete(likesTable).where(and(eq(likesTable.userId, req.userId!), eq(likesTable.postId, id)));
      liked = false;
    } else {
      await db.update(likesTable).set({ reactionType: reaction ?? "❤️" })
        .where(and(eq(likesTable.userId, req.userId!), eq(likesTable.postId, id)));
      liked = true;
    }
  } else {
    await db.insert(likesTable).values({ userId: req.userId!, postId: id, reactionType: reaction ?? "❤️" });
    liked = true;

    const [post] = await db.select({ userId: postsTable.userId }).from(postsTable).where(eq(postsTable.id, id));
    if (post && post.userId !== req.userId) {
      await db.insert(notificationsTable).values({
        recipientId: post.userId,
        senderId: req.userId!,
        type: "like",
        postId: id,
      }).onConflictDoNothing();
    }
  }

  const [{ count }] = await db.execute(sql.raw(`SELECT COUNT(*) AS count FROM likes WHERE post_id = ${id}`)).then(r => r.rows as any[]);
  res.json({ liked, count: Number(count), reaction: liked ? reaction : null });
});

// ── Toggle post save ──────────────────────────────────────────────────────────
router.post("/posts/:id/save", requireAuth, async (req, res): Promise<void> => {
  const params = TogglePostSaveParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { id } = params.data;

  const existing = await db.select().from(savedPostsTable)
    .where(and(eq(savedPostsTable.userId, req.userId!), eq(savedPostsTable.postId, id)));

  let saved: boolean;
  if (existing.length > 0) {
    await db.delete(savedPostsTable).where(and(eq(savedPostsTable.userId, req.userId!), eq(savedPostsTable.postId, id)));
    saved = false;
  } else {
    await db.insert(savedPostsTable).values({ userId: req.userId!, postId: id });
    saved = true;
  }

  res.json({ saved });
});

// ── Get post comments ─────────────────────────────────────────────────────────
router.get("/posts/:id/comments", optionalAuth, async (req, res): Promise<void> => {
  const params = GetPostCommentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { id } = params.data;

  const result = await db.execute(sql.raw(`
    SELECT c.id, c.post_id, c.content, c.parent_comment_id, c.created_at,
           u.id AS author_id, u.username AS author_username, u.display_name AS author_display_name,
           u.avatar_url AS author_avatar_url, u.verified AS author_verified, u.bio AS author_bio,
           COALESCE(lc.cnt, 0) AS like_count,
           ${req.userId ? `EXISTS(SELECT 1 FROM likes WHERE user_id = ${req.userId} AND comment_id = c.id)` : "false"} AS liked
    FROM comments c
    JOIN users u ON u.id = c.user_id
    LEFT JOIN (SELECT comment_id, COUNT(*) AS cnt FROM likes WHERE comment_id IS NOT NULL GROUP BY comment_id) lc ON lc.comment_id = c.id
    WHERE c.post_id = ${id}
    ORDER BY c.created_at ASC
  `));

  res.json((result.rows as any[]).map(buildComment));
});

// ── Create comment ────────────────────────────────────────────────────────────
router.post("/posts/:id/comments", requireAuth, async (req, res): Promise<void> => {
  const params = CreateCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { id } = params.data;

  const body = CreateCommentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [comment] = await db.insert(commentsTable).values({
    postId: id,
    userId: req.userId!,
    content: body.data.content,
    parentCommentId: body.data.parentCommentId ?? null,
  }).returning();

  const [post] = await db.select({ userId: postsTable.userId }).from(postsTable).where(eq(postsTable.id, id));
  if (post && post.userId !== req.userId) {
    await db.insert(notificationsTable).values({
      recipientId: post.userId,
      senderId: req.userId!,
      type: "comment",
      postId: id,
      commentId: comment.id,
    }).onConflictDoNothing();
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  res.status(201).json(buildComment({
    ...comment,
    post_id: comment.postId,
    parent_comment_id: comment.parentCommentId,
    created_at: comment.createdAt,
    author_id: user.id,
    author_username: user.username,
    author_display_name: user.displayName,
    author_avatar_url: user.avatarUrl,
    author_verified: user.verified,
    author_bio: user.bio,
    like_count: 0,
    liked: false,
  }));
});

// ── Delete comment ────────────────────────────────────────────────────────────
router.delete("/posts/comments/:commentId", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { commentId } = params.data;

  const [comment] = await db.select({ userId: commentsTable.userId }).from(commentsTable).where(eq(commentsTable.id, commentId));
  if (!comment) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  if (comment.userId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(commentsTable).where(eq(commentsTable.id, commentId));
  res.sendStatus(204);
});

// ── Toggle comment like ───────────────────────────────────────────────────────
router.post("/posts/comments/:commentId/like", requireAuth, async (req, res): Promise<void> => {
  const params = ToggleCommentLikeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { commentId } = params.data;

  const existing = await db.select().from(likesTable)
    .where(and(eq(likesTable.userId, req.userId!), eq(likesTable.commentId, commentId)));

  let liked: boolean;
  if (existing.length > 0) {
    await db.delete(likesTable).where(and(eq(likesTable.userId, req.userId!), eq(likesTable.commentId, commentId)));
    liked = false;
  } else {
    await db.insert(likesTable).values({ userId: req.userId!, commentId, reactionType: "❤️" });
    liked = true;
  }

  const [{ count }] = await db.execute(sql.raw(`SELECT COUNT(*) AS count FROM likes WHERE comment_id = ${commentId}`)).then(r => r.rows as any[]);
  res.json({ liked, count: Number(count), reaction: liked ? "❤️" : null });
});

export default router;
