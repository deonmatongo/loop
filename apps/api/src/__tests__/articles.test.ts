import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "@loop/db";

const app = createApp();

let cookie: string[];
let workspaceSlug: string;

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: "@articles.loop" } } });

  const reg = await request(app).post("/auth/register").send({
    email: "owner@articles.loop",
    password: "password123",
    displayName: "Owner",
  });
  cookie = (reg.headers["set-cookie"] ?? []) as string[];

  const ws = await request(app)
    .post("/workspaces")
    .set("Cookie", cookie)
    .send({ name: "Articles WS", slug: "articles-ws-test" });

  workspaceSlug = ws.body.workspace.slug as string;
});

afterAll(async () => {
  await prisma.workspace.deleteMany({ where: { slug: workspaceSlug } });
  await prisma.user.deleteMany({ where: { email: { endsWith: "@articles.loop" } } });
  await prisma.$disconnect();
});

describe("Articles CRUD", () => {
  it("creates an article", async () => {
    const res = await request(app)
      .post(`/workspaces/${workspaceSlug}/articles`)
      .set("Cookie", cookie)
      .send({ title: "Hello World", slug: "hello-world", content: "# Hello" });

    expect(res.status).toBe(201);
    expect(res.body.article.slug).toBe("hello-world");
  });

  it("rejects duplicate slug", async () => {
    const res = await request(app)
      .post(`/workspaces/${workspaceSlug}/articles`)
      .set("Cookie", cookie)
      .send({ title: "Hello World 2", slug: "hello-world", content: "dup" });

    expect(res.status).toBe(409);
  });

  it("lists articles", async () => {
    const res = await request(app)
      .get(`/workspaces/${workspaceSlug}/articles`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.articles.length).toBeGreaterThan(0);
  });

  it("fetches a single article", async () => {
    const res = await request(app)
      .get(`/workspaces/${workspaceSlug}/articles/hello-world`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.article.title).toBe("Hello World");
  });

  it("updates an article and creates a new version", async () => {
    const res = await request(app)
      .patch(`/workspaces/${workspaceSlug}/articles/hello-world`)
      .set("Cookie", cookie)
      .send({ content: "# Updated content", changeSummary: "Fix typo" });

    expect(res.status).toBe(200);
  });

  it("lists article versions", async () => {
    const res = await request(app)
      .get(`/workspaces/${workspaceSlug}/articles/hello-world/versions`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.versions.length).toBeGreaterThanOrEqual(2);
  });

  it("returns 404 for unknown article", async () => {
    const res = await request(app)
      .get(`/workspaces/${workspaceSlug}/articles/does-not-exist`)
      .set("Cookie", cookie);

    expect(res.status).toBe(404);
  });
});
