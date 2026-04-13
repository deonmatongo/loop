import type { Request, Response, NextFunction } from "express";
import { lucia } from "../lib/lucia.js";
import { prisma } from "@loop/db";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");

  if (!sessionId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (!session) {
    const blankCookie = lucia.createBlankSessionCookie();
    res.setHeader("Set-Cookie", blankCookie.serialize());
    res.status(401).json({ error: "Session expired" });
    return;
  }

  // Lucia v3: fresh sessions get a new cookie (sliding expiry)
  if (session.fresh) {
    const refreshedCookie = lucia.createSessionCookie(session.id);
    res.setHeader("Set-Cookie", refreshedCookie.serialize());
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.session = session;
  req.user = dbUser;
  next();
}
