import z from "zod";


export const createBlogSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(150, "Title too long"),
  snippet: z.string().trim().min(1, "Snippet is required").max(300, "Snippet too long"),
  body: z.string().trim().min(1, "Body is required"),
  category: z.enum([
    "tech",
    "fashion",
    "politics",
    "science",
    "sports",
    "culture",
  ]),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const updateBlogShema = z.object({
  title: z.string().trim().min(1, "Title is required").max(150, "Title too long"),
  snippet: z.string().trim().min(1, "Snippet is required").max(300, "Snippet too long"),
  body: z.string().trim().min(1, "Body is required"),
  category: z.enum([
    "tech",
    "fashion",
    "politics",
    "science",
    "sports",
    "culture",
  ]),
  status: z.enum(['draft', 'published']).default('draft'),
});
