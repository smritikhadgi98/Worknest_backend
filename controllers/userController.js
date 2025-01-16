import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { sendToken } from "../utils/jwtToken.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register User
export const register = catchAsyncErrors(async (req, res, next) => {
  const {
    name,
    email,
    phone,
    password,
    role,
    photo,
    companyDescription,
    gender,
    skills,
    resume,
  } = req.body;

  if (!name || !email || !phone || !password || !role) {
    return next(new ErrorHandler("Please fill the full form!", 400));
  }

  const isEmail = await User.findOne({ email });
  if (isEmail) {
    return next(new ErrorHandler("Email already registered!", 400));
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
    photo,
    companyDescription,
    gender,
    skills,
    resume,
  });

  sendToken(user, 201, res, "User Registered!");
});

// Login User
export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return next(new ErrorHandler("Please provide email, password, and role.", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password.", 400));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email or Password.", 400));
  }

  if (user.role !== role) {
    return next(
      new ErrorHandler(`User with provided email and ${role} not found!`, 404)
    );
  }

  sendToken(user, 200, res, "User Logged In!");
});

// Logout User
export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Logged Out Successfully.",
    });
});

// Get User
export const getUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const photoUrl = user.photo
    ? `${process.env.BASE_URL}/uploads/${user.photo}`
    : null; // Assuming you have a base URL and an endpoint to serve static files

  res.status(200).json({
    success: true,
    user: {
      ...user.toObject(),
      photo: photoUrl, // Send full URL of the photo
    },
  });
});



// Update User
export const updateUser = catchAsyncErrors(async (req, res, next) => {
  const { email, phone, address, companyDescription, skills, gender } = req.body;
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  user.email = email || user.email;
  user.phone = phone || user.phone;
  user.address = address || user.address;
  user.gender = gender || user.gender;
  user.companyDescription = companyDescription || user.companyDescription;
  user.skills = skills || user.skills;

  
  
  if (req.files) {
    const { photo, resume } = req.files;

    if (photo) {
      const oldPhotoPath = path.join(__dirname, "../uploads", user.photo || "");
      if (user.photo && fs.existsSync(oldPhotoPath)) {
        try {
          fs.unlinkSync(oldPhotoPath);
        } catch (error) {
          console.error("Failed to delete old photo:", error);
        }
      }

      const newPhotoName = `${user._id}_photo_${Date.now()}.${
        photo.mimetype.split("/")[1]
      }`;
      const newPhotoPath = path.join(__dirname, "../uploads", newPhotoName);
      photo.mv(newPhotoPath);
      user.photo = newPhotoName;
    }

    if (resume) {
      const oldResumePath = path.join(__dirname, "../uploads", user.resume || "");
      if (user.resume && fs.existsSync(oldResumePath)) {
        try {
          fs.unlinkSync(oldResumePath);
        } catch (error) {
          console.error("Failed to delete old resume:", error);
        }
      }

      const newResumeName = `${user._id}_resume_${Date.now()}.${
        resume.mimetype.split("/")[1]
      }`;
      const newResumePath = path.join(__dirname, "../uploads", newResumeName);
      resume.mv(newResumePath);
      user.resume = newResumeName;
    }
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
  });
});


export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Delete associated files if they exist
  if (user.photo) {
    const photoPath = path.join(__dirname, "../uploads", user.photo);
    if (fs.existsSync(photoPath)) {
      try {
        fs.unlinkSync(photoPath);
      } catch (error) {
        console.error("Failed to delete photo:", error);
      }
    }
  }

  if (user.resume) {
    const resumePath = path.join(__dirname, "../uploads", user.resume);
    if (fs.existsSync(resumePath)) {
      try {
        fs.unlinkSync(resumePath);
      } catch (error) {
        console.error("Failed to delete resume:", error);
      }
    }
  }

  // Delete user from the database
  await User.findByIdAndDelete(req.user.id);

  res.status(200).json({
    success: true,
    message: "User account and associated files deleted successfully!",
  });
});


import crypto from "crypto";

import sendEmail from "../utils/sendEmail.js";

// Forget Password
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler("Please provide an email address.", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("User not found with this email.", 404));
  }

  // Generate Reset Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash and set resetPasswordToken and resetPasswordExpire in the user document
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // Token expires in 15 minutes

  await user.save({ validateBeforeSave: false });

  // Create reset password URL
  // Create reset password URL
const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const message = `You have requested to reset your password. Please click on the following link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      message,
    });

    res.status(200).json({
      success: true,
      message: `Reset link sent to ${user.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler("Email could not be sent.", 500));
  }
});

/// Reset Password
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  console.log("Password reset attempt...");  // Log request
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    
    resetPasswordExpire: { $gt: Date.now() },
  });
  console.log("Reset token received:", resetPasswordToken);


  if (!user) {
    return next(new ErrorHandler("Invalid or expired reset token.", 400));
  }

  if (!req.body.password || req.body.password.length < 6) {
    return next(new ErrorHandler("Password must be at least 6 characters long.", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully.",
  });
});
