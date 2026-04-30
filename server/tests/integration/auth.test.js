const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/user.model");

beforeEach(async () => {
  await User.deleteMany({});
});

const user = {
  username: "testuser",
  email: "test@example.com",
  password: "password123",
};

// auth/regioster
describe("POST, /auth/register", () => {
  test("register a new user with code 201", async () => {
    const res = await request(app).post("/bookmyseat/auth/register").send(user);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.password).toBeUndefined();
  });

  test("check if user already exists", async () => {
    await request(app).post("/bookmyseat/auth/register").send(user);
    const res = await request(app).post("/bookmyseat/auth/register").send(user);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.user).toBeUndefined();
  });

  test("check incomplete body or mising", async () => {
    const res = await request(app).post("/bookmyseat/auth/register").send({
      username: "salmankhan",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
