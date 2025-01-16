import mongoose from "mongoose";
import validator from "validator";

const applicationSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "Please enter your Name!"],
    minLength: [3, "Name must contain at least 3 Characters!"],
    maxLength: [30, "Name cannot exceed 30 Characters!"],
  },
  lastName: {
    type: String,
    required: [true, "Please enter your Name!"],
    minLength: [3, "Name must contain at least 3 Characters!"],
    maxLength: [30, "Name cannot exceed 30 Characters!"],
  },
  email: {
    type: String,
    required: [true, "Please enter your Email!"],
    validate: [validator.isEmail, "Please provide a valid Email!"],
  },
  coverLetter: {
    public_id: {
      type: String,
      required: [true, "Please upload your Cover Letter!"],
    },
    url: {
      type: String,
      required: [true, "Please upload your Cover Letter!"],
    },
  },
  phone: {
    type: Number,
    required: [true, "Please enter your Phone Number!"],
  },
  address: {
    type: String,
    required: [true, "Please enter your Address!"],
  },
  skills: {
    type: String, 
    default: "", 
  },
  resume: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  applicantID: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["Job Seeker"],
      required: true,
    },
  },
  employerID: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["Employer"],
      required: true,
    },
  },
  status: {
    type: String,
    enum: ["Accepted", "Rejected", "Pending"],
    default: "Pending", // default status is 'pending' when the application is created
  },
  jobId: {  // Add jobId to reference Job model
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,  // Ensure the jobId is always provided
  },
  jobAppliedOn: {
    type: Date,
    default: Date.now,
  },
});

export const Application = mongoose.model("Application", applicationSchema);
