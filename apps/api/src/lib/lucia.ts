import { Lucia } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { prisma } from "@loop/db";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env["NODE_ENV"] === "production",
    },
  },
  getUserAttributes(attributes) {
    return {
      email: attributes.email,
      displayName: attributes.displayName,
      avatarUrl: attributes.avatarUrl,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string;
      displayName: string;
      avatarUrl: string | null;
    };
  }
}
