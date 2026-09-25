import { Router } from "express";
import { userAuth } from "../middleware/userAuth.js";
import { adminAuth } from "../middleware/adminAuth.js";
import upload from "../middleware/image.middleware.js";
import { createBlog, deleteBlog, getAllBlogs, getBlog, updateBlog } from "../controller/blog/blog.controller.js";

const router = Router();

//Create blog
router.post('/blogs', userAuth, adminAuth, upload.single('coverImage'), createBlog);

//Get all blogs
router.get('/blogs', getAllBlogs);

//Get a single blog
router.get('/blogs/:id', userAuth, getBlog);

//Update blog
router.patch('/blogs/:id', userAuth, adminAuth, upload.single('coverImage'), updateBlog);

//Delete blog
router.delete('/blogs/:id', userAuth, adminAuth, deleteBlog);

export default router;