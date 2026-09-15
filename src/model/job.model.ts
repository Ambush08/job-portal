import mongoose, { Schema } from "mongoose";

const jobSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    workplaceType: {
      type: String,
      enum: ["on-site", "remote", "hybrid"],
      default: "on-site",
    },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship"],
      default: "full-time",
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    category: {
      type: String,
      enum: [
        "engineering",
        "design",
        "it",
        "education",
        "marketing",
        "sales",
        "customer-support",
        "product",
        "operations",
        "finance",
        "hr",
        "other",
      ],
      required: true,
    },
    salaryMin: {
      type: Number,
    },
    salaryMax: {
      type: Number,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    responsibilities: {
      type: [String],
      required: true,
    },
    qualifications: {
      type: [String],
      required: true,
    }
  },
  { timestamps: true },
);

const Job = mongoose.model("Job", jobSchema);

export default Job;
