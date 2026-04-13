import { prisma } from "@loop/db";
import { hash } from "@node-rs/argon2";

const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

async function main() {
  const passwordHash = await hash("password123", ARGON2_OPTIONS);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: { email: "alice@example.com", passwordHash, displayName: "Alice Owner" },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: { email: "bob@example.com", passwordHash, displayName: "Bob Editor" },
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

  const article = await prisma.article.upsert({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: "getting-started" } },
    update: {},
    create: {
      workspaceId: workspace.id,
      slug: "getting-started",
      title: "Getting Started with Loop",
      content: `# Getting Started with Loop\n\nWelcome to **Loop** — your team's internal knowledge base.\n\n## What is Loop?\n\nLoop helps your team capture, organise, and share knowledge through:\n\n- **Articles** — write in Markdown, track every change with version history\n- **Playbooks** — ordered reading sequences to onboard new team members\n- **Full-text search** — find anything instantly\n- **Role-based access** — Owners, Editors, and Viewers per workspace\n\n## Your first steps\n\n1. Create or edit an article using the editor\n2. Publish it when it's ready for the team\n3. Group articles into a Playbook for onboarding flows\n\nHappy writing!`,
      publishedAt: new Date(),
      versions: {
        create: {
          authorId: alice.id,
          versionNumber: 1,
          title: "Getting Started with Loop",
          content: "Initial version",
          changeSummary: "Initial publish" as string | null,
        },
      },
    },
  });

  const article2 = await prisma.article.upsert({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: "writing-guide" } },
    update: {},
    create: {
      workspaceId: workspace.id,
      slug: "writing-guide",
      title: "Writing Guide",
      content: `# Writing Guide\n\n## Markdown basics\n\nLoop renders standard Markdown. Use these patterns:\n\n**bold**, _italic_, \`code\`\n\n- bullet list\n1. numbered list\n\n> blockquote\n\n## Tips for great articles\n\n- **Lead with the outcome** — what will the reader know or be able to do?\n- **Keep sections short** — aim for 3–5 sentences per section\n- **Use headings** — they double as an automatic table of contents\n- **Add a change summary** when you edit — the version history becomes a changelog`,
      publishedAt: new Date(),
      versions: {
        create: {
          authorId: bob.id,
          versionNumber: 1,
          title: "Writing Guide",
          content: "Initial version",
          changeSummary: "Initial publish" as string | null,
        },
      },
    },
  });

  const playbook = await prisma.playbook.upsert({
    where: { id: "seed-playbook-id" },
    update: {},
    create: {
      id: "seed-playbook-id",
      workspaceId: workspace.id,
      title: "New Employee Onboarding",
      description: "Everything a new team member needs to get up to speed in their first week.",
      items: {
        create: [
          { articleId: article.id, position: 1 },
          { articleId: article2.id, position: 2 },
        ],
      },
    },
  });

  console.log("\nSeed complete\n");
  console.log("  Workspace:", workspace.name, "(/" + workspace.slug + ")");
  console.log("  Users:");
  console.log("    alice@example.com / password123  [OWNER]");
  console.log("    bob@example.com   / password123  [EDITOR]");
  console.log("  Articles:", article.title, "|", article2.title);
  console.log("  Playbook:", playbook.title, "\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
