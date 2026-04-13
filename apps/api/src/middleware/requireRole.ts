import type { Request, Response, NextFunction } from "express";
import type { Role } from "@loop/db";

const ROLE_RANK: Record<Role, number> = {
  VIEWER: 0,
  EDITOR: 1,
  OWNER: 2,
};

/**
 * Returns middleware that rejects requests where the membership role is
 * below the required minimum. Must be used after requireMember.
 *
 * Usage: router.delete("/...", requireAuth, requireMember, requireRole("OWNER"), handler)
 */
export function requireRole(minimum: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.membership?.role;

    if (!role || ROLE_RANK[role] < ROLE_RANK[minimum]) {
      res.status(403).json({ error: `Requires ${minimum} role or higher` });
      return;
    }

    next();
  };
}
