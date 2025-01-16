import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application",
    required: true, // Links the interview to a specific application
  },
  employerID: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,  // Make sure this is required
    },
    role: {
      type: String,
      required: true,  // Ensure the role is also required
    },
  },
  interviewDate: {
    type: Date,
    required: [true, "Please schedule an interview date!"], // Date of the interview
  },
  interviewTime: {
    type: String,
    required: [true, "Please schedule an interview time!"], // Time of the interview
  },
  videoCallRoomId: { 
    type: String, 
    default: null 
  }, // Unique room ID for the video call
  status: { 
    type: String, 
    default: "Scheduled" 
  }, // "Scheduled" or "Completed"
  createdAt: {
    type: Date,
    default: Date.now, // Time when the interview was created
  },
  updatedAt: {
    type: Date,
    default: Date.now, // Time when the interview was last updated
  },
});

export const Interview = mongoose.model("Interview", interviewSchema);
