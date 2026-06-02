import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { requireAuth, signToken, safeUser } from "../lib/auth";
import { RegisterBody, LoginBody, UpdateProfileBody, ChangePasswordBody } from "@workspace/api-zod";

const router = Router();

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
