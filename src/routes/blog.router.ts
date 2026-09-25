import { Router } from "express";
import { userAuth } from "../middleware/userAuth.js";
import { adminAuth } from "../middleware/adminAuth.js";
import upload from "../middleware/image.middleware.js";
import { createBlog } from "../controller/blog/blog.controller.js";

const router = Router();

//Create blog
router.post('/blogs', userAuth, adminAuth, upload.fields([
    {name: 'coverImage', maxCount: 1},
    {name: 'galary', maxCount: 10}
]), createBlog)

//Get all blogs


//Get a single blog


//Update blog


//Delete blog