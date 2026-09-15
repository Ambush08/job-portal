import z from "zod";

export const createJobSchema = z
  .object({
    title: z.string().trim(),
    location: z.string().trim(),
    description: z.string().trim(),
    company: z.string().trim(),
    workplaceType: z.enum(["on-site", "remote", "hybrid"]),
    jobType: z.enum(["full-time", "part-time", "contract", "internship"]),
    salaryMin: z.number().positive(),
    salaryMax: z.number().positive(),
    responsibilities: z
      .array(z.string().trim().min(1))
      .min(1, "At least one    responsibility is required"),
    qualifications: z
      .array(z.string().trim().min(1))
      .min(1, "At least one qualification is required"),
    category: z.enum([
      "engineering",
      "design",
      "marketing",
      "sales",
      "it",
      "education",
      "customer-support",
      "product",
      "operations",
      "finance",
      "hr",
      "other",
    ]),
  })
.refine((data) => data.salaryMax >= data.salaryMin, {
  message: "salaryMax must be greater than or equal to salaryMin",
  path: ["salaryMax"],
});



export const updateJobSchema = z
  .object({
    title: z.string().trim(),
    location: z.string().trim(),
    description: z.string().trim(),
    company: z.string().trim(),
    workplaceType: z.enum(["on-site", "remote", "hybrid"]),
    jobType: z.enum(["full-time", "part-time", "contract", "internship"]),
    salaryMin: z.number().positive(),
    salaryMax: z.number().positive(),
    responsibilities: z
      .array(z.string().trim().min(1))
      .min(1, "At least one    responsibility is required"),
    qualifications: z
      .array(z.string().trim().min(1))
      .min(1, "At least one qualification is required"),
    category: z.enum([
      "engineering",
      "design",
      "marketing",
      "sales",
      "customer-support",
      "product",
      "operations",
      "finance",
      "hr",
      "other",
    ]),
  })
.partial()
.refine(
    (data) => {
      // both must be present to compare; if only one is being updated, skip this check
      if (data.salaryMin === undefined || data.salaryMax === undefined)
        return true;
      return data.salaryMax >= data.salaryMin;
    },
    {
      message: "salaryMax must be greater than or equal to salaryMin",
      path: ["salaryMax"],
    },
);
