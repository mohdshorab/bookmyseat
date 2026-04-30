const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/user.model");
const Event = require("../../src/models/event.model");
const Seat = require("../../src/models/seat.model");
const Booking = require("../../src/models/booking.model");

let superAdminToken, shorabToken, lalitToken, shakirToken, targetEventId, availableSeatIds;

const festivalEventData = {
  title: "Delhi Tech Carnival 2026",
  description: "Advanced concurrency testing for high-volume seat bookings",
  date: "2026-12-25T11:00:00Z",
  venue: "Pragati Maidan",
  price: 2000,
  total_seats: 15,
};


beforeAll(async () => {
  await User.deleteMany({});
  await Event.deleteMany({});
  await Seat.deleteMany({});
  await Booking.deleteMany({});

  const adminAccount = await request(app).post("/bookmyseat/auth/register").send({
    username: "shorab_admin", email: "shorab.admin@kellton.com", password: "SecureAdmin123"
  });
  await User.findByIdAndUpdate(adminAccount.body.user._id, { role: "admin" });

  const adminLoginResponse = await request(app).post("/bookmyseat/auth/login").send({
    email: "shorab.admin@kellton.com", password: "SecureAdmin123"
  });
  superAdminToken = adminLoginResponse.body.accessToken;

  const usersToCreate = [
    { username: "shorab_dev", email: "shorab@example.com", password: "Password123" },
    { username: "lalit_dev", email: "lalit@example.com", password: "Password123" },
    { username: "shakir_dev", email: "shakir@example.com", password: "Password123" }
  ];

  for (const customer of usersToCreate) {
    await request(app).post("/bookmyseat/auth/register").send(customer);
  }

  const shorabLogin = await request(app).post("/bookmyseat/auth/login").send({ email: "shorab@example.com", password: "Password123" });
  shorabToken = shorabLogin.body.accessToken;

  const lalitLogin = await request(app).post("/bookmyseat/auth/login").send({ email: "lalit@example.com", password: "Password123" });
  lalitToken = lalitLogin.body.accessToken;

  const shakirLogin = await request(app).post("/bookmyseat/auth/login").send({ email: "shakir@example.com", password: "Password123" });
  shakirToken = shakirLogin.body.accessToken;

  const eventCreationResponse = await request(app)
    .post("/bookmyseat/event")
    .set("Authorization", `Bearer ${superAdminToken}`)
    .send(festivalEventData);

  targetEventId = eventCreationResponse.body.event._id;
  const eventSeats = await Seat.find({ eventId: targetEventId }).lean();
  availableSeatIds = eventSeats.map((seat) => seat._id.toString());
});

beforeEach(async () => {
  await Booking.deleteMany({});
  await Seat.updateMany({ eventId: targetEventId }, { status: "available", lockedBy: null });
  await Event.findByIdAndUpdate(targetEventId, { available_seats: 15, booked_seats: 0 });
});


describe("checking roles", () => {
  test(" Shorab normal User from creating events", async () => {
    const badResponse = await request(app)
      .post("/bookmyseat/event")
      .set("Authorization", `Bearer ${shorabToken}`)
      .send(festivalEventData);

    expect(badResponse.statusCode).toBe(403);
    expect(badResponse.body.success).toBe(false);
  });
});


describe("checking for multiple seat req", () => {
  test("one usercan lock the same seat", async () => {
    const onlySeatLeft = availableSeatIds[0];

    const [lalitRequest, shakirRequest] = await Promise.all([
      request(app).post("/bookmyseat/booking/initiate").set("Authorization", `Bearer ${lalitToken}`).send({ eventId: targetEventId, seats: [onlySeatLeft] }),
      request(app).post("/bookmyseat/booking/initiate").set("Authorization", `Bearer ${shakirToken}`).send({ eventId: targetEventId, seats: [onlySeatLeft] }),
    ]);

    const bothResult = [lalitRequest.statusCode, shakirRequest.statusCode];

    expect(bothResult).toContain(200);
    expect(bothResult).toContain(400);

    const seatRecord = await Seat.findById(onlySeatLeft);
    expect(seatRecord.status).toBe("locked");
  });
});


describe("seat release if payment = failed", () => {
  test("release locked seats back to available if payment fails", async () => {
    const firstStep = await request(app)
      .post("/bookmyseat/booking/initiate")
      .set("Authorization", `Bearer ${lalitToken}`)
      .send({ eventId: targetEventId, seats: [availableSeatIds[1], availableSeatIds[2]] });

    const activeBookingId = firstStep.body.booking._id;

    await request(app)
      .post(`/bookmyseat/booking/confirm/${activeBookingId}`)
      .set("Authorization", `Bearer ${lalitToken}`)
      .send({ paymentStatus: "failed", transactionId: "LALIT_FAIL_001" });

    const updatedSeats = await Seat.find({ _id: { $in: [availableSeatIds[1], availableSeatIds[2]] } });
    updatedSeats.forEach(seat => expect(seat.status).toBe("available"));

    const refreshedEvent = await Event.findById(targetEventId);
    expect(refreshedEvent.available_seats).toBe(15);
  });
});

afterAll(async () => {
  await User.deleteMany({});
  await Event.deleteMany({});
});