import { Router } from "express";
import { db, closeFriendsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { buildUserSummary } from "../lib/feed";
import { sql } from "drizzle-orm";

const router = Router();

// ── Get my circle members ──────────────────────────────────────────────────
router.get("/circles/members", requireAuth, async (req, res): Promise<void> => {
  const uid = req.userId!;

  const rows = await db.execute(sql.raw(`
    SELECT u.id, u.username, u.display_name, u.avatar_url, u.verified, u.bio,
           false AS is_following, 0 AS follower_count
    FROM close_friends cf
    JOIN users u ON u.id = cf.friend_id
    WHERE cf.user_id = ${uid}
    ORDER BY cf.created_at DESC
  `));

  res.json((rows.rows as any[]).map(buildUserSummary));
});

// ── Add a user to my circle ────────────────────────────────────────────────
router.post("/circles/members/:username", requireAuth, async (req, res): Promise<void> => {
  const uid = req.userId!;
  const username = String(Array.isArray(req.params.username) ? req.params.username[0] : req.params.username).replace(/'/g, "''");

  const [friend] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (!friend) { res.status(404).json({ error: "User not found" }); return; }
  if (friend.id === uid) { res.status(400).json({ error: "Cannot add yourself" }); return; }

  await db.insert(closeFriendsTable).values({ userId: uid, friendId: friend.id }).onConflictDoNothing();

  res.json({ success: true });
});

// ── Remove a user from my circle ───────────────────────────────────────────
router.delete("/circles/members/:username", requireAuth, async (req, res): Promise<void> => {
  const uid = req.userId!;
  const username = String(Array.isArray(req.params.username) ? req.params.username[0] : req.params.username);

  const [friend] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (!friend) { res.status(404).json({ error: "User not found" }); return; }

  await db.delete(closeFriendsTable).where(
    and(eq(closeFriendsTable.userId, uid), eq(closeFriendsTable.friendId, friend.id))
  );

  res.json({ success: true });
});

export default router;
