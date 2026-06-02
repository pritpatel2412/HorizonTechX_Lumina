import { Router } from "express";
import { db, usersTable, followsTable, postsTable, notificationsTable } from "@workspace/db";
import { eq, and, ne, sql } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../lib/auth";
import { buildFeedQuery, buildUserSummary } from "../lib/feed";
import {
  GetUserProfileParams, ListUserPostsParams,
  GetUserFollowersParams, GetUserFollowingParams,
  ToggleFollowParams, SearchUsersQueryParams,
} from "@workspace/api-zod";

const router = Router();

// ── Search ───────────────────────────────────────────────────────────────────
router.get("/users/search", optionalAuth, async (req, res): Promise<void> => {
  const q = SearchUsersQueryParams.safeParse(req.query);
  if (!q.success || !q.data.q) {
    res.json([]);
    return;
  }
  const term = q.data.q.toLowerCase();
  const uid = req.userId ?? null;

  const result = await db.execute(sql.raw(`
    SELECT u.id, u.username, u.display_name, u.avatar_url, u.verified, u.bio,
           ${uid ? `EXISTS(SELECT 1 FROM follows WHERE follower_id = ${uid} AND following_id = u.id)` : "false"} AS is_following,
           (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count
    FROM users u
    WHERE LOWER(u.username) LIKE '%${term.replace(/'/g, "''")}%' OR LOWER(u.display_name) LIKE '%${term.replace(/'/g, "''")}%'
    ORDER BY u.verified DESC, follower_count DESC
    LIMIT 20
  `));

  res.json((result.rows as any[]).map(buildUserSummary));
});

// ── Suggestions ───────────────────────────────────────────────────────────────
router.get("/users/suggestions", requireAuth, async (req, res): Promise<void> => {
  const uid = req.userId!;

  const result = await db.execute(sql.raw(`
    SELECT u.id, u.username, u.display_name, u.avatar_url, u.verified, u.bio,
           false AS is_following,
           (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count
    FROM users u
    WHERE u.id != ${uid}
      AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ${uid})
    ORDER BY follower_count DESC, u.verified DESC
    LIMIT 6
  `));

  res.json((result.rows as any[]).map(buildUserSummary));
});

// ── Profile ───────────────────────────────────────────────────────────────────
router.get("/users/:username", optionalAuth, async (req, res): Promise<void> => {
  const params = GetUserProfileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid username" });
    return;
  }
  const { username } = params.data;
  const uid = req.userId ?? null;

  const result = await db.execute(sql.raw(`
    SELECT u.*,
           (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS post_count,
           (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count,
           (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count,
           ${uid ? `EXISTS(SELECT 1 FROM follows WHERE follower_id = ${uid} AND following_id = u.id)` : "false"} AS is_following
    FROM users u
    WHERE u.username = '${username.replace(/'/g, "''")}'
  `));

  if ((result.rows as any[]).length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const u = (result.rows as any[])[0];
  res.json({
    id: Number(u.id),
    username: u.username,
    displayName: u.display_name,
    avatarUrl: u.avatar_url ?? "",
    coverUrl: u.cover_url ?? "",
    bio: u.bio ?? "",
    website: u.website ?? "",
    location: u.location ?? "",
    verified: Boolean(u.verified),
    createdAt: u.created_at,
    postCount: Number(u.post_count),
    followerCount: Number(u.follower_count),
    followingCount: Number(u.following_count),
    isFollowing: Boolean(u.is_following),
  });
});

// ── User posts ────────────────────────────────────────────────────────────────
router.get("/users/:username/posts", optionalAuth, async (req, res): Promise<void> => {
  const params = ListUserPostsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid username" });
    return;
  }
  const { username } = params.data;
  const uid = req.userId ?? null;

  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const posts = await buildFeedQuery({
    where: `p.user_id = ${user.id} AND (p.scheduled_at IS NULL OR p.scheduled_at <= NOW())`,
    currentUserId: uid,
    limit: 30,
    offset: 0,
  });

  res.json(posts);
});

// ── Followers ─────────────────────────────────────────────────────────────────
router.get("/users/:username/followers", optionalAuth, async (req, res): Promise<void> => {
  const params = GetUserFollowersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid username" });
    return;
  }
  const { username } = params.data;
  const uid = req.userId ?? null;

  const result = await db.execute(sql.raw(`
    SELECT u.id, u.username, u.display_name, u.avatar_url, u.verified, u.bio,
           ${uid ? `EXISTS(SELECT 1 FROM follows WHERE follower_id = ${uid} AND following_id = u.id)` : "false"} AS is_following,
           (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count
    FROM follows f
    JOIN users u ON u.id = f.follower_id
    JOIN users target ON target.username = '${username.replace(/'/g, "''")}'
    WHERE f.following_id = target.id
    ORDER BY f.created_at DESC
    LIMIT 100
  `));

  res.json((result.rows as any[]).map(buildUserSummary));
});

// ── Following ─────────────────────────────────────────────────────────────────
router.get("/users/:username/following", optionalAuth, async (req, res): Promise<void> => {
  const params = GetUserFollowingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid username" });
    return;
  }
  const { username } = params.data;
  const uid = req.userId ?? null;

  const result = await db.execute(sql.raw(`
    SELECT u.id, u.username, u.display_name, u.avatar_url, u.verified, u.bio,
           ${uid ? `EXISTS(SELECT 1 FROM follows WHERE follower_id = ${uid} AND following_id = u.id)` : "false"} AS is_following,
           (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count
    FROM follows f
    JOIN users u ON u.id = f.following_id
    JOIN users src ON src.username = '${username.replace(/'/g, "''")}'
    WHERE f.follower_id = src.id
    ORDER BY f.created_at DESC
    LIMIT 100
  `));

  res.json((result.rows as any[]).map(buildUserSummary));
});

// ── Toggle follow ─────────────────────────────────────────────────────────────
router.post("/users/:username/follow", requireAuth, async (req, res): Promise<void> => {
  const params = ToggleFollowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid username" });
    return;
  }
  const { username } = params.data;
  const uid = req.userId!;

  const [target] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (target.id === uid) {
    res.status(400).json({ error: "Cannot follow yourself" });
    return;
  }

  const existing = await db.select().from(followsTable)
    .where(and(eq(followsTable.followerId, uid), eq(followsTable.followingId, target.id)));

  let following: boolean;
  if (existing.length > 0) {
    await db.delete(followsTable).where(and(eq(followsTable.followerId, uid), eq(followsTable.followingId, target.id)));
    following = false;
  } else {
    await db.insert(followsTable).values({ followerId: uid, followingId: target.id });
    following = true;

    await db.insert(notificationsTable).values({
      recipientId: target.id,
      senderId: uid,
      type: "follow",
    }).onConflictDoNothing();
  }

  const [{ count }] = await db.execute(sql.raw(`SELECT COUNT(*) AS count FROM follows WHERE following_id = ${target.id}`)).then(r => r.rows as any[]);
  res.json({ following, count: Number(count) });
});

export default router;
