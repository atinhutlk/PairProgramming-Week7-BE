const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const User = require("../models/userModel");

const api = supertest(app);

const baseUserData = {
  name: "Test User",
  email: "valid@example.com",
  password: "secret1", // >= 6 chars
  phone_number: "09-123-47890",
  gender: "Male",
  date_of_birth: "1999-01-01",
  membership_status: "Active",
};

// Clean users collection before each test
beforeEach(async () => {
  await User.deleteMany({});
});

// ---------------- SIGNUP ----------------
describe("POST /api/users/signup", () => {
  it("should signup a new user with valid data", async () => {
    const res = await api
      .post("/api/users/signup")
      .send(baseUserData)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    expect(res.body).toHaveProperty("email", baseUserData.email);
    // Response không có plaintext password
    expect(res.body.password).toBeUndefined();

    const userInDb = await User.findOne({ email: baseUserData.email });
    expect(userInDb).not.toBeNull();
    expect(userInDb.email).toBe(baseUserData.email);
  });

  it("should return 400 when email is missing", async () => {
    const { email, ...rest } = baseUserData; // bỏ email

    const res = await api.post("/api/users/signup").send(rest).expect(400);

    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 when password is missing", async () => {
    const { password, ...rest } = baseUserData; // bỏ password

    const res = await api.post("/api/users/signup").send(rest).expect(400);

    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 for invalid email format", async () => {
    const userData = {
      ...baseUserData,
      email: "not-an-email", // invalid
    };

    const res = await api.post("/api/users/signup").send(userData).expect(400);

    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 when password is too short", async () => {
    const userData = {
      ...baseUserData,
      password: "123", // < 6 chars
    };

    const res = await api.post("/api/users/signup").send(userData).expect(400);

    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 when email is already in use", async () => {
    // first signup
    await api.post("/api/users/signup").send(baseUserData).expect(201);

    // second signup with same email
    const res = await api
      .post("/api/users/signup")
      .send(baseUserData)
      .expect(400);

    expect(res.body).toHaveProperty("error");
  });
});

// ---------------- LOGIN ----------------
describe("POST /api/users/login", () => {
  it("should login with valid credentials and return a JWT token", async () => {
    await api.post("/api/users/signup").send(baseUserData).expect(201);

    // Login
    const res = await api
      .post("/api/users/login")
      .send({
        email: baseUserData.email,
        password: baseUserData.password,
      })
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(res.body).toHaveProperty("token");
    const token = res.body.token;
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // JWT: header.payload.signature
  });

  it("should return 401 when email does not exist", async () => {
    const res = await api
      .post("/api/users/login")
      .send({
        email: "notfound@example.com",
        password: "whatever123",
      })
      .expect(401); // invalid email -> 401

    expect(res.body).toHaveProperty("error");
  });

  it("should return 401 when password is wrong", async () => {
    await api
      .post("/api/users/signup")
      .send({
        ...baseUserData,
        email: "wrongpass@example.com",
      })
      .expect(201);

    const res = await api
      .post("/api/users/login")
      .send({
        email: "wrongpass@example.com",
        password: "wrongpassword",
      })
      .expect(401); // wrong password -> 401

    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 when email or password is missing", async () => {
    const res1 = await api
      .post("/api/users/login")
      .send({ password: "secret1" })
      .expect(400);
    expect(res1.body).toHaveProperty("error");

    const res2 = await api
      .post("/api/users/login")
      .send({ email: "someone@example.com" })
      .expect(400);
    expect(res2.body).toHaveProperty("error");
  });
});

// Close DB connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});
