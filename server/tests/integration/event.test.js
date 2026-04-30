const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const User = require("../../src/models/user.model");
const Event = require("../../src/models/event.model");

let adminToken;
let userToken;
let createdEventId;

const validEvent = {
  title: "Summer Fest",
  description: "A grand musical festival in the city",
  date: "2027-06-15T18:00:00Z",
  venue: "Grand Plaza",
  price: 500,
  total_seats: 10,
};

beforeAll(async () => {
  await User.deleteMany({});
  await Event.deleteMany({});

  const adminRes = await request(app)
    .post("/bookmyseat/auth/register")
    .send({
      username: "adminuser",
      email: "admin@example.com",
      password: "admin1234",
    });

  await User.findByIdAndUpdate(adminRes.body.user._id, { role: "admin" });

  const adminLogin = await request(app)
    .post("/bookmyseat/auth/login")
    .send({ email: "admin@example.com", password: "admin1234" });

  adminToken = adminLogin.body.accessToken;

  await request(app)
    .post("/bookmyseat/auth/register")
    .send({
      username: "normaluser",
      email: "user@example.com",
      password: "user1234",
    });

  const userLogin = await request(app)
    .post("/bookmyseat/auth/login")
    .send({ email: "user@example.com", password: "user1234" });

  userToken = userLogin.body.accessToken;
});

afterAll(async () => {
  await User.deleteMany({});
  await Event.deleteMany({});
});

// bookmyseat/event/
describe("POST /bookmyseat/event", () => {

  test("create event and return 201", async () => {
    const res = await request(app)
      .post("/bookmyseat/event")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validEvent);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.event).toBeDefined();
    expect(res.body.event.title).toBe(validEvent.title);
    expect(res.body.event.available_seats).toBe(validEvent.total_seats);

    createdEventId = res.body.event._id;
  });

  test("normal user shouldn't create event and status 403", async () => {
    const res = await request(app)
      .post("/bookmyseat/event")
      .set("Authorization", `Bearer ${userToken}`)
      .send(validEvent);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test("should return 400 if duplicate title", async () => {
    const res = await request(app)
      .post("/bookmyseat/event")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validEvent);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

});


// bookmyseat/event - delete
describe("DELETE /bookmyseat/event/:id", () => {

  test("user should not delete event — return 403", async () => {
    const res = await request(app)
      .delete(`/bookmyseat/event/${createdEventId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test("admin should delete event successfully", async () => {
    const res = await request(app)
      .delete(`/bookmyseat/event/${createdEventId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("should return 404 after deletion", async () => {
    const res = await request(app).get(`/bookmyseat/event/${createdEventId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

});