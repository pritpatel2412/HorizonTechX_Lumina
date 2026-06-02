import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

export async function buildFeedQuery(opts: {
  where: string;
  currentUserId: number | null;
  limit: number;
  offset: number;
  orderBy?: string;
}) {
  const { where, currentUserId, limit, offset, orderBy = "p.created_at DESC" } = opts;

  const rows = await db.execute(sql.raw(`
    WITH post_likes AS (
      SELECT post_id, COUNT(*) AS like_count FROM likes WHERE post_id IS NOT NULL GROUP BY post_id
    ),
    post_comments AS (
      SELECT post_id, COUNT(*) AS comment_count FROM comments GROUP BY post_id
    ),
    post_reactions AS (
      SELECT post_id,
             json_agg(json_build_object('reaction', reaction_type, 'count', cnt) ORDER BY cnt DESC) AS top_reactions
      FROM (
        SELECT post_id, reaction_type, COUNT(*) AS cnt FROM likes WHERE post_id IS NOT NULL GROUP BY post_id, reaction_type ORDER BY cnt DESC
      ) r
      GROUP BY post_id
    )
    SELECT
      p.id, p.content, p.image_url, p.image_url2, p.post_type, p.views, p.scheduled_at, p.created_at,
      u.id AS author_id, u.username AS author_username, u.display_name AS author_display_name,
      u.avatar_url AS author_avatar_url, u.verified AS author_verified, u.bio AS author_bio,
      COALESCE(pl.like_count, 0) AS like_count,
      COALESCE(pc.comment_count, 0) AS comment_count,
      ${currentUserId ? `EXISTS(SELECT 1 FROM likes WHERE user_id = ${currentUserId} AND post_id = p.id)` : 'false'} AS user_liked,
      ${currentUserId ? `EXISTS(SELECT 1 FROM saved_posts WHERE user_id = ${currentUserId} AND post_id = p.id)` : 'false'} AS user_saved,
      ${currentUserId ? `(SELECT reaction_type FROM likes WHERE user_id = ${currentUserId} AND post_id = p.id)` : 'null'} AS user_reaction,
      COALESCE(pr.top_reactions, '[]') AS top_reactions
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN post_likes pl ON pl.post_id = p.id
    LEFT JOIN post_comments pc ON pc.post_id = p.id
    LEFT JOIN post_reactions pr ON pr.post_id = p.id
    WHERE ${where}
    ORDER BY ${orderBy}
    LIMIT ${limit} OFFSET ${offset}
  `));

  const postIds = (rows.rows as any[]).map((r: any) => r.id);
  let previewMap: Record<number, any[]> = {};

  if (postIds.length > 0) {
    const previewRows = await db.execute(sql.raw(`
      SELECT c.id, c.post_id, c.content, c.parent_comment_id, c.created_at,
             u.id AS author_id, u.username AS author_username, u.display_name AS author_display_name,
             u.avatar_url AS author_avatar_url, u.verified AS author_verified, u.bio AS author_bio,
             COALESCE(lc.cnt, 0) AS like_count,
             ${currentUserId ? `EXISTS(SELECT 1 FROM likes WHERE user_id = ${currentUserId} AND comment_id = c.id)` : 'false'} AS liked
      FROM comments c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN (SELECT comment_id, COUNT(*) AS cnt FROM likes WHERE comment_id IS NOT NULL GROUP BY comment_id) lc ON lc.comment_id = c.id
      WHERE c.post_id IN (${postIds.join(",")}) AND c.parent_comment_id IS NULL
      ORDER BY c.created_at ASC
    `));

    for (const row of previewRows.rows as any[]) {
      if (!previewMap[row.post_id]) previewMap[row.post_id] = [];
      if (previewMap[row.post_id].length < 2) {
        previewMap[row.post_id].push(buildComment(row));
      }
    }
  }

  return (rows.rows as any[]).map((r: any) => buildFeedPost(r, previewMap[r.id] ?? []));
}

export function buildFeedPost(r: any, previewComments: any[] = []) {
  return {
    id: Number(r.id),
    content: r.content ?? "",
    imageUrl: r.image_url ?? "",
    imageUrl2: r.image_url2 ?? "",
    postType: r.post_type ?? "post",
    views: Number(r.views ?? 0),
    scheduledAt: r.scheduled_at ?? null,
    createdAt: r.created_at,
    author: {
      id: Number(r.author_id),
      username: r.author_username,
      displayName: r.author_display_name,
      avatarUrl: r.author_avatar_url ?? "",
      verified: Boolean(r.author_verified),
      bio: r.author_bio ?? "",
      isFollowing: false,
    },
    likeCount: Number(r.like_count ?? 0),
    commentCount: Number(r.comment_count ?? 0),
    liked: Boolean(r.user_liked),
    saved: Boolean(r.user_saved),
    myReaction: r.user_reaction ?? null,
    topReactions: Array.isArray(r.top_reactions) ? r.top_reactions.slice(0, 3) : [],
    previewComments,
  };
}

export function buildComment(r: any) {
  return {
    id: Number(r.id),
    postId: Number(r.post_id),
    content: r.content ?? "",
    parentCommentId: r.parent_comment_id ? Number(r.parent_comment_id) : null,
    createdAt: r.created_at,
    author: {
      id: Number(r.author_id),
      username: r.author_username,
      displayName: r.author_display_name,
      avatarUrl: r.author_avatar_url ?? "",
      verified: Boolean(r.author_verified),
      bio: r.author_bio ?? "",
    },
    likeCount: Number(r.like_count ?? 0),
    liked: Boolean(r.liked),
  };
}

export function buildUserSummary(u: any) {
  return {
    id: Number(u.id),
    username: u.username,
    displayName: u.display_name ?? u.displayName ?? "",
    avatarUrl: u.avatar_url ?? u.avatarUrl ?? "",
    verified: Boolean(u.verified),
    bio: u.bio ?? "",
    isFollowing: Boolean(u.is_following ?? u.isFollowing ?? false),
    followerCount: Number(u.follower_count ?? u.followerCount ?? 0),
  };
}
