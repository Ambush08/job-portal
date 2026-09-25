import mongoose, { Schema, Types, Document } from "mongoose";
import { IUser } from "./user.model.js";

export interface IJob extends Document {
  title: string;
  location: string;
  description: string;
  company: string;
  workplaceType: "on-site" | "remote" | "hybrid";
  jobType: "full-time" | "part-time" | "contract" | "internship";
  status: "open" | "closed";
  category:
    | "engineering"
    | "design"
    | "it"
    | "education"
    | "marketing"
    | "sales"
    | "customer-support"
    | "product"
    | "operations"
    | "finance"
    | "hr"
    | "other";
  salaryMin: number;
  salaryMax: number;
  postedBy: Types.ObjectId;
  responsibilities: string[];
  qualifications: string[];
  createdAt: Date;
  updatedAt: Date
}

export interface IJobPopulated extends Omit<IJob, 'postedBy'> {
  postedBy: IUser
}

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
    },
  },
  { timestamps: true },
);

const Job = mongoose.model("Job", jobSchema);

export default Job;
