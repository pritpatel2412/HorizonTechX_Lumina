import { Router } from "express";
import { db, messagesTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

const safeStr = (s: string | string[]) => String(Array.isArray(s) ? s[0] : s).replace(/'/g, "''");

// ── Unread DM count ────────────────────────────────────────────────────────────
router.get("/messages/unread-count", requireAuth, async (req, res): Promise<void> => {
  const uid = req.userId!;
  const [row] = await db.execute(
    sql.raw(`SELECT COUNT(*) AS count FROM messages WHERE receiver_id = ${uid} AND read = false`)
  ).then(r => r.rows as any[]);
  res.json({ count: Number(row?.count ?? 0) });
});

// ── Get all conversations (one row per peer, latest message) ──────────────────
router.get("/messages", requireAuth, async (req, res): Promise<void> => {
  const uid = req.userId!;

  const rows = await db.execute(sql.raw(`
    SELECT DISTINCT ON (other_id)
      other_id,
      m.id, m.content, m.sender_id, m.receiver_id, m.read, m.created_at,
      u.username, u.display_name, u.avatar_url, u.verified, u.bio,
      (SELECT COUNT(*)::int FROM messages
       WHERE receiver_id = ${uid} AND sender_id = other_id AND read = false) AS unread_count
    FROM (
      SELECT CASE WHEN sender_id = ${uid} THEN receiver_id ELSE sender_id END AS other_id, id
      FROM messages WHERE sender_id = ${uid} OR receiver_id = ${uid}
    ) sub
    JOIN messages m ON m.id = sub.id
    JOIN users u ON u.id = sub.other_id
    ORDER BY other_id, m.created_at DESC
  `)).then(r => r.rows as any[]);

  const convs = rows
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((r: any) => ({
      user: {
        id: Number(r.other_id),
        username: r.username,
        displayName: r.display_name,
        avatarUrl: r.avatar_url ?? "",
        verified: Boolean(r.verified),
        bio: r.bio ?? "",
      },
      lastMessage: {
        id: Number(r.id),
        content: r.content,
        senderId: Number(r.sender_id),
        receiverId: Number(r.receiver_id),
        read: Boolean(r.read),
        createdAt: r.created_at,
        sender: {
          id: Number(r.sender_id),
          username: r.username,
          displayName: r.display_name,
          avatarUrl: r.avatar_url ?? "",
          verified: Boolean(r.verified),
          bio: r.bio ?? "",
        },
      },
      unreadCount: Number(r.unread_count ?? 0),
    }));

  res.json(convs);
});

// ── Get thread with a specific user ──────────────────────────────────────────
router.get("/messages/:username", requireAuth, async (req, res): Promise<void> => {
  const uid = req.userId!;
  const username = safeStr(req.params.username);

  const [other] = await db.execute(sql.raw(
    `SELECT id FROM users WHERE username = '${username}'`
  )).then(r => r.rows as any[]);

  if (!other) { res.status(404).json({ error: "User not found" }); return; }
  const otherId = Number(other.id);

  const rows = await db.execute(sql.raw(`
    SELECT m.id, m.content, m.sender_id, m.receiver_id, m.read, m.created_at,
           u.username AS su, u.display_name AS sd, u.avatar_url AS sa,
           u.verified AS sv, u.bio AS sb
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE (m.sender_id = ${uid} AND m.receiver_id = ${otherId})
       OR (m.sender_id = ${otherId} AND m.receiver_id = ${uid})
    ORDER BY m.created_at ASC
    LIMIT 200
  `)).then(r => r.rows as any[]);

  res.json(rows.map((r: any) => ({
    id: Number(r.id),
    content: r.content,
    senderId: Number(r.sender_id),
    receiverId: Number(r.receiver_id),
    read: Boolean(r.read),
    createdAt: r.created_at,
    sender: {
      id: Number(r.sender_id),
      username: r.su,
      displayName: r.sd,
      avatarUrl: r.sa ?? "",
      verified: Boolean(r.sv),
      bio: r.sb ?? "",
    },
  })));
});

// ── Send message ──────────────────────────────────────────────────────────────
router.post("/messages/:username", requireAuth, async (req, res): Promise<void> => {
  const uid = req.userId!;
  const username = safeStr(req.params.username);
  const { content } = req.body;

  if (!content || typeof content !== "string" || !content.trim()) {
    res.status(400).json({ error: "Content is required" }); return;
  }

  const [other] = await db.execute(sql.raw(
    `SELECT id, username, display_name, avatar_url, verified, bio FROM users WHERE username = '${username}'`
  )).then(r => r.rows as any[]);

  if (!other) { res.status(404).json({ error: "User not found" }); return; }
  if (Number(other.id) === uid) { res.status(400).json({ error: "Cannot message yourself" }); return; }

  const [me] = await db.execute(sql.raw(
    `SELECT username, display_name, avatar_url, verified, bio FROM users WHERE id = ${uid}`
  )).then(r => r.rows as any[]);

  const [msg] = await db.insert(messagesTable).values({
    senderId: uid,
    receiverId: Number(other.id),
    content: content.trim(),
  }).returning();

  res.status(201).json({
    id: msg.id,
    content: msg.content,
    senderId: msg.senderId,
    receiverId: msg.receiverId,
    read: msg.read,
    createdAt: msg.createdAt,
    sender: {
      id: uid,
      username: me.username,
      displayName: me.display_name,
      avatarUrl: me.avatar_url ?? "",
      verified: Boolean(me.verified),
      bio: me.bio ?? "",
    },
  });
});

// ── Mark thread as read ───────────────────────────────────────────────────────
router.post("/messages/:username/read", requireAuth, async (req, res): Promise<void> => {
  const uid = req.userId!;
  const username = safeStr(req.params.username);

  const [other] = await db.execute(sql.raw(
    `SELECT id FROM users WHERE username = '${username}'`
  )).then(r => r.rows as any[]);

  if (!other) { res.status(404).json({ error: "User not found" }); return; }

  await db.execute(sql.raw(
    `UPDATE messages SET read = true WHERE sender_id = ${Number(other.id)} AND receiver_id = ${uid} AND read = false`
  ));
  res.json({ success: true });
});

export default router;
