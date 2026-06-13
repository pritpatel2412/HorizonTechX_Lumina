import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, postsTable, commentsTable, likesTable, followsTable,
         notificationsTable, savedPostsTable, messagesTable, storiesTable,
         storyViewsTable, closeFriendsTable } from "@workspace/db";
import { eq, or, inArray, count } from "drizzle-orm";
import { requireAuth, signToken, safeUser } from "../lib/auth";
import { RegisterBody, LoginBody, UpdateProfileBody, ChangePasswordBody } from "@workspace/api-zod";

const router = Router();

function getClientIp(req: any): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return (typeof forwarded === "string" ? forwarded : forwarded[0]).split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "";
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, displayName, email, password } = parsed.data;

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    res.status(400).json({ error: "Username must be 3-20 chars, letters/numbers/underscore only" });
    return;
  }

  const clientIp = getClientIp(req);

  if (clientIp) {
    const [{ value: ipCount }] = await db
      .select({ value: count() })
      .from(usersTable)
      .where(eq(usersTable.registrationIp, clientIp));

    if (ipCount >= 3) {
      res.status(429).json({ error: "Too many accounts created from this network. Maximum 3 per IP." });
      return;
    }
  }

  const existing = await db.select({ id: usersTable.id })
    .from(usersTable)
    .where(or(eq(usersTable.username, username), eq(usersTable.email, email)))
    .limit(1);

  if (existing.length > 0) {
    res.status(400).json({ error: "Username or email already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db.insert(usersTable).values({
    username,
    displayName,
    email,
    passwordHash,
    bio: "",
    avatarUrl: "",
    coverUrl: "",
    website: "",
    location: "",
    verified: false,
    registrationIp: clientIp,
  }).returning();

  const token = signToken(user.id);
  res.status(201).json({ token, user: safeUser(user) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { identifier, password } = parsed.data;

  const [user] = await db.select().from(usersTable)
    .where(or(eq(usersTable.email, identifier), eq(usersTable.username, identifier)))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken(user.id);
  res.json({ token, user: safeUser(user) });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(safeUser(user));
});

router.delete("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const uid = req.userId!;

  const userPosts = await db.select({ id: postsTable.id }).from(postsTable).where(eq(postsTable.userId, uid));
  const postIds = userPosts.map(p => p.id);

  const userStories = await db.select({ id: storiesTable.id }).from(storiesTable).where(eq(storiesTable.userId, uid));
  const storyIds = userStories.map(s => s.id);

  const userComments = await db.select({ id: commentsTable.id }).from(commentsTable).where(eq(commentsTable.userId, uid));
  const commentIds = userComments.map(c => c.id);

  await db.delete(notificationsTable).where(
    or(eq(notificationsTable.recipientId, uid), eq(notificationsTable.senderId, uid))
  );

  if (storyIds.length > 0) {
    await db.delete(storyViewsTable).where(
      or(eq(storyViewsTable.viewerId, uid), inArray(storyViewsTable.storyId, storyIds))
    );
  } else {
    await db.delete(storyViewsTable).where(eq(storyViewsTable.viewerId, uid));
  }

  const likeConditions: any[] = [eq(likesTable.userId, uid)];
  if (postIds.length > 0) likeConditions.push(inArray(likesTable.postId, postIds));
  if (commentIds.length > 0) likeConditions.push(inArray(likesTable.commentId, commentIds));
  await db.delete(likesTable).where(or(...likeConditions));

  const savedConditions: any[] = [eq(savedPostsTable.userId, uid)];
  if (postIds.length > 0) savedConditions.push(inArray(savedPostsTable.postId, postIds));
  await db.delete(savedPostsTable).where(or(...savedConditions));

  const commentConditions: any[] = [eq(commentsTable.userId, uid)];
  if (postIds.length > 0) commentConditions.push(inArray(commentsTable.postId, postIds));
  await db.delete(commentsTable).where(or(...commentConditions));

  await db.delete(messagesTable).where(
    or(eq(messagesTable.senderId, uid), eq(messagesTable.receiverId, uid))
  );

  await db.delete(followsTable).where(
    or(eq(followsTable.followerId, uid), eq(followsTable.followingId, uid))
  );

  await db.delete(closeFriendsTable).where(
    or(eq(closeFriendsTable.userId, uid), eq(closeFriendsTable.friendId, uid))
  );

  await db.delete(storiesTable).where(eq(storiesTable.userId, uid));
  await db.delete(postsTable).where(eq(postsTable.userId, uid));
  await db.delete(usersTable).where(eq(usersTable.id, uid));

  res.json({ success: true });
});

router.patch("/auth/profile", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;

  const update: Partial<typeof usersTable.$inferInsert> = {};
  if (data.displayName != null) update.displayName = data.displayName;
  if (data.bio != null) update.bio = data.bio;
  if (data.website != null) update.website = data.website;
  if (data.location != null) update.location = data.location;
  if (data.avatarUrl != null) update.avatarUrl = data.avatarUrl;
  if (data.coverUrl != null) update.coverUrl = data.coverUrl;

  const [updated] = await db.update(usersTable).set(update).where(eq(usersTable.id, req.userId!)).returning();
  res.json(safeUser(updated));
});

router.post("/auth/change-password", requireAuth, async (req, res): Promise<void> => {
  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { oldPassword, newPassword } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const ok = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!ok) {
    res.status(400).json({ error: "Incorrect current password" });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, req.userId!));
  res.json({ success: true });
});

export default router;
