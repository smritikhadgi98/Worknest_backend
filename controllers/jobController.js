import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Job } from "../models/jobSchema.js";
import ErrorHandler from "../middlewares/error.js";

// Get All Jobs (with user info, including photo)
// In your jobController.js
// Get All Jobs with Filtering After Fetching
export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  const { type, experience, title, address } = req.query; // Get filter and search params from query

  // Fetch all jobs (without any filtering)
  const jobs = await Job.find({ expired: false })
    .populate('postedBy', 'name photo companyDescription address') // Populating postedBy with user info
    .exec();

  // Apply filters and search
  const filteredJobs = filterJobs(jobs, { type, experience, title, address });

  res.status(200).json({
    success: true,
    jobs: filteredJobs,
  });
});

// Function to filter and search jobs
const filterJobs = (jobs, filters) => {
  const { type, experience, title, address } = filters;
  console.log(jobs);

  // Filter by type if provided
  if (type) {
    jobs = jobs.filter(job => job.type === type);
  }

  // Filter by experience if provided
  if (experience) {
    jobs = jobs.filter(job => job.experience === experience);
  }

  // Filter by title if provided (case-insensitive)
  if (title) {
    const titleRegex = new RegExp(title, "i");
    jobs = jobs.filter(job => titleRegex.test(job.title));
  }

  // Filter by address if provided (case-insensitive)
  if (address) {
    console.log('Address filter:', address); // Debug the value of the address filter
    const addressRegex = new RegExp(address, "i");
    jobs = jobs.filter(job => job.postedBy && addressRegex.test(job.postedBy.address)); // Ensure job.postedBy exists
  }

  return jobs;
};

// Post a Job (Ensure the employer is posting the job)
export const postJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }

  const {
    title,
    description,
    type,
    salary,
    vacancy,
    deadline,
    requirement,
    experience,
  } = req.body;

  if (
    !title ||
    !description ||
    !type ||
    !salary ||
    !vacancy ||
    !deadline ||
    !requirement ||
    !experience
  ) {
    return next(new ErrorHandler("Please provide full job details.", 400));
  }

  const postedBy = req.user._id;

  const job = await Job.create({
    title,
    description,
    type,
    salary,
    vacancy,
    deadline,
    requirement,
    postedBy,
    experience,
  });

  res.status(200).json({
    success: true,
    message: "Job Posted Successfully!",
    job,
  });
});

// Get Jobs Posted by the User
export const getMyJobs = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }

  // Fetch jobs posted by the user (use the req.user._id)
  const myJobs = await Job.find({ postedBy: req.user._id })
    .populate("postedBy", "photo name") // Populate user info (photo, name)
    .exec();

  res.status(200).json({
    success: true,
    myJobs,
  });
});

// Update Job
export const updateJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }

  const { id } = req.params;
  let job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("OOPS! Job not found.", 404));
  }

  // Update the job
  job = await Job.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    message: "Job Updated!",
  });
});

// Delete Job
export const deleteJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }

  const { id } = req.params;
  const job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("OOPS! Job not found.", 404));
  }

  await job.deleteOne();
  res.status(200).json({
    success: true,
    message: "Job Deleted!",
  });
});

// Get Single Job (with user info, including photo)
export const getSingleJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  try {
    const job = await Job.findById(id)
      .populate('postedBy', 'name photo companyDescription address')  // Populating postedBy with user name and photo
      .exec();

    if (!job) {
      return next(new ErrorHandler("Job not found.", 404));
    }
    
    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    return next(new ErrorHandler(`Invalid ID / CastError`, 404));
  }
});



