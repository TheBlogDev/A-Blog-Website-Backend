import { describe, it, beforeAll, afterAll, beforeEach, expect, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import app from "../app";

/**
 * @todo:
 * Check typings - are there any places we've missed that could benefit from TS types?
 * Continue tests for unhappy paths
 */


let mongodb: MongoMemoryServer;
const testUserId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId();
const testBlogPost: string = "Hello world! Welcome to my blog!";

vi.mock("../middleware/requireAuth.js", () => {
  return {
    default: vi.fn((req, _res, next) => {
      req.user = { _id: testUserId };
      next();
    })

  }
});

beforeAll(async () => {
  mongodb = await MongoMemoryServer.create();
  const uri: string = mongodb.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongodb.stop();
});

beforeEach(async () => {
  if (!mongoose.connection.db) {
    throw new Error("Database connection is not established.");
  }
  const collections: mongoose.mongo.Collection[] = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

describe("Blogpost API endpoints - Happy Path", () => {

  it("GET /api/blogpost - what happens when no id provided?", async () => {
    const res = await request(app).get("/api/blogpost");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it("POST /api/blogpost - should create a new blog post", async () => {
    const res = await request(app)
      .post("/api/blogpost")
      .send({ title: "Test Post", body: testBlogPost });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("title", "Test Post");
  });

  it("GET /api/blogpost/:id - should get a single blog post", async () => {
    const postRes = await request(app)
      .post("/api/blogpost")
      .send({ title: "Single Post", body: testBlogPost });
    const id = postRes.body._id;
    const res = await request(app).get(`/api/blogpost/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("title", "Single Post");
  });

  it("PATCH /api/blogpost/:id - should update a blog post", async () => {
    const postRes = await request(app)
      .post("/api/blogpost")
      .send({ title: "Update Me", body: testBlogPost});
    const id = postRes.body._id;
    const res = await request(app)
      .patch(`/api/blogpost/${id}`)
      .send({ title: "Updated Title"});
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("title", "Updated Title");
  });

  it("DELETE /api/blogpost/:id - should delete a blog post", async () => {
    const postRes = await request(app)
      .post("/api/blogpost")
      .send({ title: "Delete Me", body: testBlogPost });
    const id = postRes.body._id;
    const res = await request(app).delete(`/api/blogpost/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("title", "Delete Me");
  });
});

describe("Blogpost API endpoints - Unhappy Path", () => {
  // might we return 4xx here if GET can't find a blog post
  // 4xx if id is not provided?
  // 404 maybe as we can't find a blog post if no id is provided
  it("GET /api/blogpost - handles when no id provided", async () => {
    const res = await request(app).get("/api/blogpost");
  });

});
