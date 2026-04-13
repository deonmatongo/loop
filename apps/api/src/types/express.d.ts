import type { User, Membership, Workspace } from "@loop/db";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: import("lucia").Session;
      workspace?: Workspace;
      membership?: Membership;
    }
  }
}
