import express from "express";
import {
  scheduleInterview,
  getJobSeekerInterviewDetails,
  getEmployerInterviewDetails,
  getRoomId, // Added this import for retrieving room ID
} from "../controllers/interviewController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { validateInterviewTime } from "../middlewares/validateInterview.js";

const router = express.Router();

// Employer Routes
router.get("/employer-interview", isAuthenticated, getEmployerInterviewDetails);
router.post("/schedule", isAuthenticated, scheduleInterview); // For scheduling interviews

// Job Seeker Routes
router.get("/jobseeker-interview", isAuthenticated, getJobSeekerInterviewDetails);

// Shared Route for both Employers and Job Seekers to get room ID
router.get("/room/:applicationId", isAuthenticated, validateInterviewTime, getRoomId);

export default router;
