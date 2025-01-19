import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { Interview } from "../models/interviewSchema.js";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";

// Get Interview Details for an Employer
export const getEmployerInterviewDetails = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(new ErrorHandler("Job Seekers are not allowed to access this resource.", 400));
  }

  const { _id } = req.user;

  const applications = await Application.find({
    "employerID.user": _id,
    status: "Accepted",
  }).populate("jobId");

  const interviewDetails = await Promise.all(
    applications.map(async (application) => {
      const interview = await Interview.findOne({ applicationId: application._id });
  
      return {
        applicantName: `${application.firstName} ${application.lastName}`,
        jobTitle: application.jobId.title,
        applicationId: application._id,
        interviewDate: interview?.interviewDate ? moment(interview.interviewDate).format("MMMM Do YYYY") : null,
        interviewTime: interview?.interviewTime ? moment(interview.interviewTime, "HH:mm").format("hh:mm A") : null,
        status: interview?.status || "Pending",
        roomId: interview?.videoCallRoomId || null,  // Add video call room ID
      };
    })
  );

  res.status(200).json({
    success: true,
    interviewDetails,
  });
});

// Schedule or Reschedule Interview
export const scheduleInterview = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role !== "Employer") {
    return next(new ErrorHandler("Only Employers are allowed to schedule interviews.", 400));
  }

  const { applicationId, interviewDate, interviewTime } = req.body;

  if (!applicationId || !interviewDate || !interviewTime) {
    return next(new ErrorHandler("Please provide application ID, interview date, and time.", 400));
  }

  const application = await Application.findById(applicationId);
  if (!application || application.status !== "Accepted") {
    return next(new ErrorHandler("Invalid application ID or application is not accepted.", 404));
  }

  let interview = await Interview.findOne({ applicationId });
  if (interview) {
    interview.interviewDate = interviewDate;
    interview.interviewTime = interviewTime;
  } else {
    interview = new Interview({
      applicationId,
      interviewDate,
      interviewTime,
      employerID: {
        user: req.user._id,
        role: req.user.role,
      },
      videoCallRoomId: uuidv4(), // Generates a unique room ID
    });
  }

  await interview.save();

  res.status(200).json({
    success: true,
    message: "Interview scheduled/rescheduled successfully.",
    interview,
  });
});

// Get Interview Details for a Job Seeker
export const getJobSeekerInterviewDetails = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role !== "Job Seeker") {
    return next(new ErrorHandler("Only Job Seekers can access this resource.", 400));
  }

  const { _id } = req.user;

  const applications = await Application.find({
    "applicantID.user": _id,
    status: "Accepted",
  })
    .populate("jobId")
    .populate("employerID.user", "name");

  console.log(JSON.stringify(applications, null, 2)); // Debugging log

  const interviewDetails = await Promise.all(
    applications.map(async (application) => {
      const interview = await Interview.findOne({ applicationId: application._id });

      return {
        jobTitle: application.jobId?.title || "N/A",
        employerName: application.employerID?.user?.name || "N/A", // Safely access name
        interviewDate: interview?.interviewDate
          ? moment(interview.interviewDate).format("MMMM Do YYYY")
          : null,
        interviewTime: interview?.interviewTime
          ? moment(interview.interviewTime, "HH:mm").format("hh:mm A")
          : null,
        status: interview?.status || "Pending",
        roomId: interview?.videoCallRoomId || null, // Include room ID
      };
    })
  );

  res.status(200).json({
    success: true,
    interviewDetails,
  });
});

// Get Video Call Room ID
export const getRoomId = catchAsyncErrors(async (req, res, next) => {
  const { applicationId } = req.params;

  const interview = await Interview.findOne({ applicationId });
  if (!interview) {
    return next(new ErrorHandler("Interview not found.", 404));
  }

  // Get the interview date & time in a proper format
  const interviewDateTime = moment(`${interview.interviewDate} ${interview.interviewTime}`, "MMMM Do YYYY hh:mm A");
  const currentTime = moment();

  // Calculate the difference in minutes
  const timeDifference = currentTime.diff(interviewDateTime, "minutes");

  // Allow access only if it's within 1 hour (60 minutes) after the scheduled time
  if (timeDifference < 0) {
    return next(new ErrorHandler("You can only join the meeting after the scheduled time.", 403));
  }
  if (timeDifference > 60) {
    return next(new ErrorHandler("The video call session has expired.", 403));
  }

  res.status(200).json({
    success: true,
    roomId: interview.videoCallRoomId,
  });
});

