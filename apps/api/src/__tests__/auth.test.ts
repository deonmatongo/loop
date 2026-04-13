import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "@loop/db";

const app = createApp();

beforeAll(async () => {
  // Clean test users
  await prisma.user.deleteMany({ where: { email: { endsWith: "@test.loop" } } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: "@test.loop" } } });
  await prisma.$disconnect();
});

describe("POST /auth/register", () => {
  it("creates a user and returns a session cookie", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "alice@test.loop",
      password: "password123",
      displayName: "Alice Test",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("alice@test.loop");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects duplicate email", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "alice@test.loop",
      password: "password123",
      displayName: "Alice Duplicate",
    });

    expect(res.status).toBe(409);
  });

  it("validates required fields", async () => {
    const res = await request(app).post("/auth/register").send({ email: "bad" });
    expect(res.status).toBe(400);
    expect(res.body.issues).toBeDefined();
  });
});

describe("POST /auth/login", () => {
  it("returns session cookie on valid credentials", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "alice@test.loop",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("alice@test.loop");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects wrong password", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "alice@test.loop",
      password: "wrong",
    });

    expect(res.status).toBe(401);
  });
});

describe("GET /auth/me", () => {
  it("returns 401 without a session", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns user with valid session", async () => {
    const loginRes = await request(app).post("/auth/login").send({
      email: "alice@test.loop",
      password: "password123",
    });

    const cookie = (loginRes.headers["set-cookie"] ?? []) as string[];
    const meRes = await request(app).get("/auth/me").set("Cookie", cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe("alice@test.loop");
  });
});
