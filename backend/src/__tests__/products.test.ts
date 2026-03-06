import request from "supertest";
import { app } from "../server";
import { prisma } from "../config/database";

describe("Products API", () => {
  let adminToken: string;
  let productId: string;
  let productSlug: string;

  beforeAll(async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@shopify-clone.com", password: "Admin1234!" });
    adminToken = login.body.data?.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/products", () => {
    it("should return products list", async () => {
      const res = await request(app).get("/api/products");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it("should support search", async () => {
      const res = await request(app).get("/api/products?search=headphones");
      expect(res.status).toBe(200);
    });

    it("should support category filter", async () => {
      const res = await request(app).get("/api/products?category=electronics");
      expect(res.status).toBe(200);
    });

    it("should support price range filter", async () => {
      const res = await request(app).get(
        "/api/products?minPrice=10&maxPrice=200",
      );
      expect(res.status).toBe(200);
      res.body.data.forEach((p: any) => {
        expect(Number(p.basePrice)).toBeGreaterThanOrEqual(10);
        expect(Number(p.basePrice)).toBeLessThanOrEqual(200);
      });
    });
  });

  describe("GET /api/products/featured", () => {
    it("should return featured products", async () => {
      const res = await request(app).get("/api/products/featured");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("POST /api/products (admin)", () => {
    it("should reject non-admin users", async () => {
      const res = await request(app)
        .post("/api/products")
        .send({ name: "Test Product", slug: "test-product" });
      expect(res.status).toBe(401); // No token
    });

    it("should create a product as admin", async () => {
      if (!adminToken) return;
      const catRes = await request(app).get("/api/categories");
      const categoryId = catRes.body.data[0]?.id;
      if (!categoryId) return;

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Test Product Jest",
          slug: `test-product-jest-${Date.now()}`,
          description: "Test product description that is long enough",
          categoryId,
          basePrice: 49.99,
          sku: `TEST-JEST-${Date.now()}`,
          stock: 10,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Test Product Jest");
      productId = res.body.data.id;
      productSlug = res.body.data.slug;
    });
  });

  describe("GET /api/products/:slug", () => {
    it("should return product detail", async () => {
      const res = await request(app).get(
        "/api/products/wireless-noise-cancelling-headphones",
      );
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBeDefined();
    });

    it("should return 404 for unknown slug", async () => {
      const res = await request(app).get("/api/products/does-not-exist-xyz");
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/products/:id (admin)", () => {
    it("should soft-delete a product", async () => {
      if (!adminToken || !productId) return;
      const res = await request(app)
        .delete(`/api/products/${productId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });
});
