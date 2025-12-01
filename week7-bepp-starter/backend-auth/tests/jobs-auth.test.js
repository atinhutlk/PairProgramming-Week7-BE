const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const User = require("../models/userModel");
const Job = require("../models/jobModel");

const api = supertest(app);

const sampleJob = {
  title: "Software Engineer",
  type: "Full-Time",
  description: "Build cool stuff",
  company: {
    name: "Tech Corp",
    contactEmail: "hr@techcorp.com",
    contactPhone: "123-456-7890",
  },
};

let token;
let userId;

beforeAll(async () => {
  await User.deleteMany({});
  await Job.deleteMany({});

  const res = await api.post("/api/users/signup").send({
    name: "Auth User",
    email: "auth@example.com",
    password: "secret1",
    phone_number: "09-123-4567",
    gender: "Male",
    date_of_birth: "1990-01-01",
    membership_status: "Active",
  });

  token = res.body.token;

  const user = await User.findOne({ email: "auth@example.com" });
  userId = user._id.toString();
});

afterEach(async () => {
  await Job.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Protected Jobs Routes", () => {
  // ---------- WITHOUT TOKEN (401) ----------

  it("POST /api/jobs without token should return 401", async () => {
    await api.post("/api/jobs").send(sampleJob).expect(401);
  });

  it("PUT /api/jobs/:id without token should return 401", async () => {
    const job = await Job.create({
      ...sampleJob,
      user_id: new mongoose.Types.ObjectId(),
    });

    await api
      .put(`/api/jobs/${job._id}`)
      .send({ title: "Updated Title" })
      .expect(401);
  });

  it("DELETE /api/jobs/:id without token should return 401", async () => {
    const job = await Job.create({
      ...sampleJob,
      user_id: new mongoose.Types.ObjectId(),
    });

    await api.delete(`/api/jobs/${job._id}`).expect(401);
  });

  it("POST /api/jobs with invalid token format should return 401", async () => {
    await api
      .post("/api/jobs")
      .set("Authorization", "Bearer invalid-token")
      .send(sampleJob)
      .expect(401);
  });


  // ---------- WITH VALID TOKEN (SUCCESS CASES) ----------

  it("POST /api/jobs should create a job (201)", async () => {
    const res = await api
      .post("/api/jobs")
      .set("Authorization", `Bearer ${token}`)
      .send(sampleJob)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    expect(res.body.title).toBe(sampleJob.title);
    expect(res.body.company.name).toBe(sampleJob.company.name);

    const jobInDb = await Job.findById(res.body._id);
    expect(jobInDb).not.toBeNull();
  });

  it("Created job should be associated with authenticated user", async () => {
    const res = await api
      .post("/api/jobs")
      .set("Authorization", `Bearer ${token}`)
      .send(sampleJob)
      .expect(201);

    const jobInDb = await Job.findById(res.body._id);
    expect(jobInDb).not.toBeNull();
    expect(jobInDb.user_id.toString()).toBe(userId);
  });

  it("PUT /api/jobs/:id should update job (200)", async () => {
    const created = await api
      .post("/api/jobs")
      .set("Authorization", `Bearer ${token}`)
      .send(sampleJob)
      .expect(201);

    const jobId = created.body._id;

    const res = await api
      .put(`/api/jobs/${jobId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Updated description" })
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(res.body.description).toBe("Updated description");

    const updatedInDb = await Job.findById(jobId);
    expect(updatedInDb.description).toBe("Updated description");
  });

  it("DELETE /api/jobs/:id should delete job (204)", async () => {
    const created = await api
      .post("/api/jobs")
      .set("Authorization", `Bearer ${token}`)
      .send(sampleJob)
      .expect(201);

    const jobId = created.body._id;

    await api
      .delete(`/api/jobs/${jobId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    const deletedInDb = await Job.findById(jobId);
    expect(deletedInDb).toBeNull();
  });


});
