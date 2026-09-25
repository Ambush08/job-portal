import { Router } from "express";
import { createJob, deleteJob, getAllJobs, getSingleJob, updateJob } from "../controller/job/job.controller.js";
import { userAuth } from "../middleware/userAuth.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { uploadProfileImage } from "../controller/user.controller.js";
import upload from "../middleware/image.middleware.js";

const router = Router();


//Create job
router.post('/jobs/create', userAuth, adminAuth, createJob);

//Get all jobs 
router.get('/jobs', getAllJobs);

//Get single job
router.get('/jobs/:id', userAuth, getSingleJob);

//Update job post
router.patch('/jobs/delete/:id', userAuth, adminAuth, updateJob);

//Delete a job posting
router.delete('/jobs/delete/:id', userAuth, adminAuth, deleteJob);

//Upload profile image
router.post('/jobs/user/profile', userAuth, upload.single('profileImage'), uploadProfileImage);

//Upload profile image 
router.post('/user/profile', userAuth, upload.single('profileImage'), uploadProfileImage);


export default router;