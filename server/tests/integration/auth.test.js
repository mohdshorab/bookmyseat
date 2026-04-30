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

// auth/login
describe("POST /bookmyseat/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/bookmyseat/auth/register").send(user);
  });

  test("should login successfully and return accessToken", async () => {
    const res = await request(app)
      .post("/bookmyseat/auth/login")
      .send({ email: user.email, password: user.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  test("should return 401 if password is wrong", async () => {
    const res = await request(app)
      .post("/bookmyseat/auth/login")
      .send({ email: user.email, password: "wrongpassword" });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("should return 404 if email does not exist", async () => {
    const res = await request(app)
      .post("/bookmyseat/auth/login")
      .send({ email: "ghost@example.com", password: "password123" });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// auth/logout
describe("POST /bookmyseat/auth/logout", () => {
  test("should logout and clear the cookie", async () => {

    await request(app).post("/bookmyseat/auth/register").send(user);
    const loginRes = await request(app)
      .post("/bookmyseat/auth/login")
      .send({ email: user.email, password: user.password });

    const res = await request(app)
      .post("/bookmyseat/auth/logout")
      .set("Cookie", loginRes.headers["set-cookie"]);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers["set-cookie"][0]).toMatch(/refreshToken=;/);
  });
});
