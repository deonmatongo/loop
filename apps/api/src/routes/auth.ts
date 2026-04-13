import { Router, type Router as ExpressRouter } from "express";
import { hash, verify } from "@node-rs/argon2";
import { prisma } from "@loop/db";
import { lucia } from "../lib/lucia.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../middleware/errors.js";
import { RegisterSchema, LoginSchema } from "@loop/shared";

const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

export const authRouter: ExpressRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const body = RegisterSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await hash(body.password, ARGON2_OPTIONS);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        displayName: body.displayName,
      },
      select: { id: true, email: true, displayName: true, createdAt: true },
    });

    const session = await lucia.createSession(user.id, {});
    const cookie = lucia.createSessionCookie(session.id);
    res.setHeader("Set-Cookie", cookie.serialize());
    res.status(201).json({ user });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await verify(user.passwordHash, body.password, ARGON2_OPTIONS);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const session = await lucia.createSession(user.id, {});
    const cookie = lucia.createSessionCookie(session.id);
    res.setHeader("Set-Cookie", cookie.serialize());
    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    });
  })
);

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    await lucia.invalidateSession(req.session!.id);
    const blankCookie = lucia.createBlankSessionCookie();
    res.setHeader("Set-Cookie", blankCookie.serialize());
    res.status(204).send();
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = req.user!;
    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    });
  })
);
