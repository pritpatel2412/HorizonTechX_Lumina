import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { GetNotificationsQueryParams, MarkNotificationReadParams } from "@workspace/api-zod";

const router = Router();

// ── Get notifications ──────────────────────────────────────────────────────────
router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const q = GetNotificationsQueryParams.safeParse(req.query);
  const offset = q.success ? (q.data.offset ?? 0) : 0;
  const limit = q.success ? (q.data.limit ?? 30) : 30;
  const uid = req.userId!;

  const result = await db.execute(sql.raw(`
    SELECT n.id, n.type, n.read, n.post_id, n.comment_id, n.created_at,
           u.id AS sender_id, u.username AS sender_username, u.display_name AS sender_display_name,
           u.avatar_url AS sender_avatar_url, u.verified AS sender_verified, u.bio AS sender_bio,
           p.content AS post_preview
    FROM notifications n
    JOIN users u ON u.id = n.sender_id
    LEFT JOIN posts p ON p.id = n.post_id
    WHERE n.recipient_id = ${uid}
    ORDER BY n.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `));

  res.json((result.rows as any[]).map((r: any) => ({
    id: Number(r.id),
    type: r.type,
    read: Boolean(r.read),
    postId: r.post_id ? Number(r.post_id) : null,
    commentId: r.comment_id ? Number(r.comment_id) : null,
    createdAt: r.created_at,
    sender: {
      id: Number(r.sender_id),
      username: r.sender_username,
      displayName: r.sender_display_name,
      avatarUrl: r.sender_avatar_url ?? "",
      verified: Boolean(r.sender_verified),
      bio: r.sender_bio ?? "",
    },
    postPreview: r.post_preview ? String(r.post_preview).slice(0, 100) : null,
  })));
});

// ── Unread count ───────────────────────────────────────────────────────────────
router.get("/notifications/unread-count", requireAuth, async (req, res): Promise<void> => {
  const uid = req.userId!;
  const [row] = await db.execute(sql.raw(`SELECT COUNT(*) AS count FROM notifications WHERE recipient_id = ${uid} AND read = false`))
    .then(r => r.rows as any[]);
  res.json({ count: Number(row?.count ?? 0) });
});

// ── Mark all read ─────────────────────────────────────────────────────────────
router.post("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  const uid = req.userId!;
  await db.execute(sql.raw(`UPDATE notifications SET read = true WHERE recipient_id = ${uid}`));
  res.json({ success: true });
});

// ── Mark one read ─────────────────────────────────────────────────────────────
router.post("/notifications/read/:id", requireAuth, async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { id } = params.data;
  const uid = req.userId!;

  await db.execute(sql.raw(`UPDATE notifications SET read = true WHERE id = ${id} AND recipient_id = ${uid}`));
  res.json({ success: true });
});

export default router;
