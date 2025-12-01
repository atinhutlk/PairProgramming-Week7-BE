const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const Job = require("../models/jobModel");

const api = supertest(app);

const jobs = [
  {
    title: "Software Engineer",
    type: "Full-Time",
    description: "Develop amazing software",
    location: "Helsinki",
    salary: 5000,
    company: {
      name: "Tech Corp",
      contactEmail: "hr@tech.com",
      contactPhone: "123-456-7890",
    },
  },
  {
    title: "Product Manager",
    type: "Full-Time",
    description: "Manage product roadmap",
    location: "Espoo",
    salary: 6000,
    company: {
      name: "Product Corp",
      contactEmail: "jobs@product.com",
      contactPhone: "555-555-5555",
    },
  },
];

beforeEach(async () => {
  await Job.deleteMany({});
  await Job.insertMany(jobs);
});

// ---------------- GET ----------------
describe("GET /api/jobs", () => {
  it("should return all jobs as JSON", async () => {
    const response = await api
      .get("/api/jobs")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(response.body).toHaveLength(jobs.length);
    expect(response.body[0].title).toBe(jobs[0].title);
    expect(response.body[0].company.name).toBe(jobs[0].company.name);
  });

  it("should return an empty array when there are no jobs", async () => {
    await Job.deleteMany({});

    const response = await api
      .get("/api/jobs")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(response.body).toEqual([]);
  });
});

describe("GET /api/jobs/:id", () => {
  it("should return one job by ID", async () => {
    const job = await Job.findOne();
    const response = await api
      .get(`/api/jobs/${job._id}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(response.body.title).toBe(job.title);
    expect(response.body.company.name).toBe(job.company.name);
  });

  it("should return 404 for a non-existing job ID", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    await api.get(`/api/jobs/${nonExistentId}`).expect(404);
  });

  it("should return 404 for an invalid job ID", async () => {
    await api.get("/api/jobs/invalid-id").expect(404);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
