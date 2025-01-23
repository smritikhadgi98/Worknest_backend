import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import { User } from "../models/userSchema.js";
import cloudinary from "cloudinary";

// Post Application for Job Seeker
export const postApplication = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;

  if (role === "Employer") {
    return next(
      new ErrorHandler("Employer not allowed to access this resource.", 400)
    );
  }

  if (!req.files || !req.files.resume || !req.files.coverLetter) {
    return next(new ErrorHandler("Resume and Cover Letter Files Required!", 400));
  }

  console.log(req.files)

  const { resume, coverLetter } = req.files;

  const allowedFormats = ["application/pdf", "image/png", "image/jpeg", "image/webp",  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

  if (!allowedFormats.includes(resume.mimetype) || !allowedFormats.includes(coverLetter.mimetype)) {
    return next(new ErrorHandler("Invalid file type. Only PDF or Image formats are allowed.", 400));
  }

  // Determine the resource type based on file mimetype (image or raw)
  const resumeResourceType = resume.mimetype === "application/pdf" ? "raw" : "image";
  const coverLetterResourceType = coverLetter.mimetype === "application/pdf" ? "raw" : "image";

  // Upload Resume to Cloudinary
  const resumeUpload = await cloudinary.uploader.upload(resume.tempFilePath, {
    resource_type: resumeResourceType
  });
  if (!resumeUpload || resumeUpload.error) {
    console.error("Cloudinary Resume Error:", resumeUpload.error || "Unknown error");
    return next(new ErrorHandler("Failed to upload Resume to Cloudinary", 500));
  }

  // Upload Cover Letter to Cloudinary
  const coverLetterUpload = await cloudinary.uploader.upload(coverLetter.tempFilePath, {
    resource_type: coverLetterResourceType
  });
  if (!coverLetterUpload || coverLetterUpload.error) {
    console.error("Cloudinary Cover Letter Error:", coverLetterUpload.error || "Unknown error");
    return next(new ErrorHandler("Failed to upload Cover Letter to Cloudinary", 500));
  }

  const { firstName, lastName, email, phone, address, skills, jobId } = req.body;

  if (!jobId) {
    return next(new ErrorHandler("Job not found!", 404));
  }

  const jobDetails = await Job.findById(jobId);
  if (!jobDetails) {
    return next(new ErrorHandler("Job not found!", 404));
  }

  const applicantID = {
    user: req.user._id,
    role: "Job Seeker",
  };

  const employerID = {
    user: jobDetails.postedBy,
    role: "Employer",
  };

  if (!firstName || !lastName || !email || !phone || !address || !skills) {
    return next(new ErrorHandler("Please fill all fields.", 400));
  }

  const application = await Application.create({
    firstName,
    lastName,
    email,
    phone,
    skills,
    address,
    jobId, // Add jobId here to link the application to the job
    applicantID,
    employerID,
    resume: {
      public_id: resumeUpload.public_id,
      url: resumeUpload.secure_url,  // Secure URL for resume
    },
    coverLetter: {
      public_id: coverLetterUpload.public_id,
      url: coverLetterUpload.secure_url,  // Secure URL for cover letter
    },
  });

  res.status(200).json({
    success: true,
    message: "Application Submitted!",
    application,
  });
});

// Employer updates Interview for Application
export const updateApplicationStatus = catchAsyncErrors(async (req, res) => {
  const { id } = req.params; // Application ID
  const { status } = req.body; // New status

  try {
    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({ message: "Application not found!" });
    }

    application.status = status; // Update the status
    await application.save(); // Save the changes

    res.status(200).json({
      success: true,
      message: "Application status updated successfully!",
      application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update application status!",
      error: error.message,
    });
  }
});

// Employer gets all Applications for their Job
export const employerGetAllApplications = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;

  if (role === "Job Seeker") {
    return next(new ErrorHandler("Job Seeker not allowed to access this resource.", 400));
  }

  const { _id } = req.user;

  // Fetching applications for the employer
  const applications = await Application.find({ "employerID.user": _id });

  // Adding job title from Job schema and applicant details to the response
  const applicationsWithDetails = await Promise.all(applications.map(async (application) => {
    const job = await Job.findById(application.jobId);  // Fetch job details using jobId
    const employer = await User.findById(application.employerID.user);  // Fetch employer details

    return {
      ...application.toObject(),
      jobTitle: job ? job.title : "Job not found",  // Add job title
      applicantName: `${application.firstName} ${application.lastName}`, // Add applicant's full name
      employerName: employer ? employer.name : "Employer not found",  // Add employer name
    };
  }));

  res.status(200).json({
    success: true,
    applications: applicationsWithDetails,
  });
});

// Jobseeker gets all Applications they have applied to
export const jobseekerGetAllApplications = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;

  if (role === "Employer") {
    return next(new ErrorHandler("Employer not allowed to access this resource.", 400));
  }

  const { _id } = req.user;

  // Fetching applications for the jobseeker
  const applications = await Application.find({ "applicantID.user": _id })
    .populate("employerID.user", "name") // Populate employer's name
    .exec();

  // Adding job title from Job schema and applicant details to the response
  const applicationsWithDetails = await Promise.all(applications.map(async (application) => {
    const job = await Job.findById(application.jobId);  // Fetch job details using jobId
    const employer = await User.findById(application.employerID.user);  // Fetch employer details

    return {
      ...application.toObject(),
      jobTitle: job ? job.title : "Job not found",  // Add job title
      employerName: employer ? employer.name : "Employer not found",  // Add employer name
    };
  }));

  res.status(200).json({
    success: true,
    applications: applicationsWithDetails,
  });
});

// Jobseeker can delete their Application
export const jobseekerDeleteApplication = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;

  if (role === "Employer") {
    return next(new ErrorHandler("Employer not allowed to access this resource.", 400));
  }

  const { id } = req.params;

  const application = await Application.findById(id);

  if (!application) {
    return next(new ErrorHandler("Application not found!", 404));
  }

  await application.deleteOne();

  res.status(200).json({
    success: true,
    message: "Application Deleted!",
  });
});
