import Job from "../../model/job.model.js";
import { Request, Response } from "express";
import { createJobSchema, updateJobSchema } from "./jobSchema.js";
import type { RequestAuth } from "../../middleware/userAuth.js";
import { isValidObjectId } from "mongoose";

//Create job posting
export const createJob = async (req: RequestAuth, res: Response) => {
  const result = createJobSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid data",
      error: result.error.flatten(),
    });
  }
  try {
    const {
      title,
      location,
      description,
      company,
      responsibilities,
      qualifications,
      workplaceType,
      jobType,
      salaryMax,
      salaryMin,
      category,
    } = result.data;

    const job = await Job.create({
      title,
      location,
      description,
      company,
      responsibilities,
      qualifications,
      salaryMax,
      salaryMin,
      workplaceType,
      jobType,
      category,
      postedBy: req.userId,
    });

    return res.status(201).json({
      message: "New job created successfully",
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        company: job.company,
        responsibilities: job.responsibilities,
        qualifications: job.qualifications,
        salaryMax: job.salaryMax,
        salaryMin: job.salaryMin,
        workplaceType: job.workplaceType,
        jobType: job.jobType,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Read all job posts
export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category as string | undefined;

    const VALID_CATEGORIES = [
      "engineering",
      "it",
      "education",
      "design",
      "marketing",
      "sales",
      "customer-support",
      "product",
      "operations",
      "finance",
      "hr",
      "other",
    ];

    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const filter = category ? { category } : ({} as any);

    const jobs = await Job.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await Job.countDocuments(filter);

    if (jobs.length === 0) {
      return res.status(200).json({
        message: "No jobs at the moment",
      });
    }

    return res.status(200).json({
      jobs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Read single job post
export const getSingleJob = async (req: RequestAuth, res: Response) => {
  try {
    const id = req.params.id as string;

    const job = (await Job.findById(id).populate(
      "postedBy",
      "firstName lastName",
    )) as any;

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    return res.status(200).json({
      job: {
        title: job.title,
        location: job.location,
        description: job.description,
        company: job.company,
        responsibilities: job.responsibilities,
        qualifications: job.qualifications,
        salaryMax: job.salaryMax,
        salaryMin: job.salaryMin,
        workplaceType: job.workplaceType,
        jobType: job.jobType,
        category: job.category,
        postedBy: `${job.postedBy.firstName} ${job.postedBy.lastName}`,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Update job post
export const updateJob = async (req: RequestAuth, res: Response) => {
  const result = updateJobSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid data",
      error: result.error.flatten(),
    });
  }
  try {
    const id = req.params.id as string;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const {
      title,
      location,
      description,
      company,
      responsibilities,
      qualifications,
      workplaceType,
      jobType,
      salaryMax,
      salaryMin,
      category,
    } = result.data;

    const existingJob = await Job.findById(id);

    if (!existingJob) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (
      existingJob.postedBy.toString() !== req.userId &&
      req.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You do not have the permission to edit this job post",
      });
    }

    const job = await Job.findByIdAndUpdate(
      id,
      {
        title,
        location,
        description,
        company,
        responsibilities,
        qualifications,
        salaryMax,
        salaryMin,
        workplaceType,
        jobType,
        category,
      },
      { new: true, runValidators: true },
    );

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    return res.status(200).json({
      message: "Job updated successfully",
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        company: job.company,
        responsibilities: job.responsibilities,
        qualifications: job.qualifications,
        salaryMax: job.salaryMax,
        salaryMin: job.salaryMin,
        workplaceType: job.workplaceType,
        jobType: job.jobType,
        category: job!.category,
        status: job!.status,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Delete job post
export const deleteJob = async (req: RequestAuth, res: Response) => {
  try {
    const id = req.params.id as string;

    const existingJob = await Job.findById(id);

    if (!existingJob) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (
      existingJob.postedBy.toString() !== req.userId &&
      req.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You do not have the permission to delete this job post",
      });
    }

    await Job.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
