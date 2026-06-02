import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET ?? "lumina-secret-fallback";

export function signToken(userId: number): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { sub: number } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown as { sub: number };
    return payload;
  } catch {
    return null;
  }
}

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  req.userId = payload.sub;
  next();
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.userId = payload.sub;
  }
  next();
}

export async function getUserById(id: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  return user ?? null;
}

export function safeUser(u: typeof usersTable.$inferSelect) {
  const { passwordHash: _, ...safe } = u;
  return {
    ...safe,
    verified: u.verified,
    avatarUrl: u.avatarUrl,
    coverUrl: u.coverUrl,
    displayName: u.displayName,
    createdAt: u.createdAt,
  };
}
