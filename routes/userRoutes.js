import express from "express";
import {
  login,
  register,
  logout,
  getUser,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// Register new user
router.post("/register", register);

// User login
router.post("/login", login);

// User logout (only accessible for authenticated users)
router.get("/logout", logout);

// Get user details (only accessible for authenticated users)
router.get("/getuser", isAuthenticated, getUser);

// Update user details (only accessible for authenticated users)
router.put("/update", isAuthenticated, updateUser);

// Delete user profile (only accessible for authenticated users)
router.delete("/delete", isAuthenticated, deleteUser);

// Forgot password
router.post("/forgot-password", forgotPassword);

// Reset password using token
router.put("/reset-password/:token", resetPassword);

export default router;
