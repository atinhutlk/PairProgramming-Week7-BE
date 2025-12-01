const mongoose = require("mongoose");
const Job = require("../models/jobModel");

// GET /api/jobs
const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({});
    return res.status(200).json(jobs);
  } catch (error) {
    return res.status(500).json({ message: "Failed to retrieve jobs" });
  }
};

// GET /api/jobs/:jobId
const getJobById = async (req, res) => {
  const { jobId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(404).json({ message: "Job not found" });
  }

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    return res.status(200).json(job);
  } catch (error) {
    return res.status(500).json({ message: "Failed to retrieve job" });
  }
};

// POST /api/jobs
const createJob = async (req, res) => {
  const { title, type, description, location, salary, company } = req.body;

  if (!title || !company || !company.name) {
    return res
      .status(400)
      .json({ message: "Title and company.name are required" });
  }

  try {
    const job = await Job.create({
      title,
      type,
      description,
      location,
      salary,
      company,
    });

    return res.status(201).json(job);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create job" });
  }
};

// PUT /api/jobs/:jobId
const updateJob = async (req, res) => {
  const { jobId } = req.params; 

  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ message: "Job not found" });
  }

  if (req.body.title === "") {
    return res.status(400).json({ message: "Invalid job data" });
  }

  try {
    const updatedJob = await Job.findByIdAndUpdate(jobId, req.body, {
      new: true,          
      runValidators: true,
    });

    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    
    return res.status(200).json(updatedJob);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update job" });
  }
};

// DELETE /api/jobs/:jobId
const deleteJob = async (req, res) => {
  const { jobId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ message: "Job not found" });
  }

  try {
    const deletedJob = await Job.findByIdAndDelete(jobId);

    if (!deletedJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Test expect 204
    return res.status(204).end();
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete job" });
  }
};

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
};
