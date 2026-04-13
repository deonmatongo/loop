import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("password123", {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      passwordHash,
      displayName: "Alice Owner",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      passwordHash,
      displayName: "Bob Editor",
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "acme" },
    update: {},
    create: {
      slug: "acme",
      name: "Acme Corp",
      plan: "FREE",
      memberships: {
        create: [
          { userId: alice.id, role: "OWNER" },
          { userId: bob.id, role: "EDITOR" },
        ],
      },
    },
  });

  const article = await prisma.article.create({
    data: {
      workspaceId: workspace.id,
      slug: "getting-started",
      title: "Getting Started",
      content: "# Getting Started\n\nWelcome to Loop. This is your first article.",
      publishedAt: new Date(),
    },
  });

  await prisma.articleVersion.create({
    data: {
      articleId: article.id,
      authorId: alice.id,
      versionNumber: 1,
      title: article.title,
      content: article.content,
      changeSummary: "Initial version",
    },
  });

  const playbook = await prisma.playbook.create({
    data: {
      workspaceId: workspace.id,
      title: "New Employee Onboarding",
      description: "Everything a new team member needs to get up to speed.",
      items: {
        create: [{ articleId: article.id, position: 1 }],
      },
    },
  });

  console.log("Seed complete:", { alice, bob, workspace, article, playbook });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
