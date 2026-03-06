import request from "supertest";
import { app } from "../server";
import { prisma } from "../config/database";

describe("Auth API", () => {
  let accessToken: string;
  let refreshToken: string;
  const testEmail = `test_${Date.now()}@example.com`;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: "test_" } } });
    await prisma.$disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: testEmail, password: "Test1234!", name: "Test User" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.accessToken).toBeDefined();
      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it("should not allow duplicate email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: testEmail, password: "Test1234!", name: "Test User" });
      expect(res.status).toBe(409);
    });

    it("should validate password strength", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "new@test.com", password: "weak", name: "Test" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with correct credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: testEmail, password: "Test1234!" });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      accessToken = res.body.data.accessToken;
    });

    it("should reject wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: testEmail, password: "WrongPass123!" });
      expect(res.status).toBe(401);
    });

    it("should reject nonexistent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nobody@example.com", password: "Test1234!" });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return user data with valid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testEmail);
    });

    it("should reject request without token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should issue new tokens", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });
  });
});
