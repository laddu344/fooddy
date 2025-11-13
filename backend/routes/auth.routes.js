import express from "express";
import asyncHandler from "../middlewares/asyncHandler.js"; // default import
import isAuth from "../middlewares/isAuth.js";
import {
  signUp,
  signIn,
  signOut,
  sendOtp,
  verifyOtp,
  resetPassword,
  googleAuth,
  getProfileController, // include profile controller if you have it
} from "../controllers/auth.controllers.js";
import { getUserTypes } from "../controllers/superadmin.controllers.js";

const authRouter = express.Router();

// ------------------ AUTH ROUTES ------------------

// Signup
authRouter.post("/signup", asyncHandler(signUp));

// Signin
authRouter.post("/signin", asyncHandler(signIn));

// Signout
authRouter.get("/signout", asyncHandler(signOut));

// Send OTP
authRouter.post("/send-otp", asyncHandler(sendOtp));

// Verify OTP
authRouter.post("/verify-otp", asyncHandler(verifyOtp));

// Reset Password
authRouter.post("/reset-password", asyncHandler(resetPassword));

// Google Auth
authRouter.post("/google-auth", asyncHandler(googleAuth));

// Public endpoint for user types (needed for signup)
authRouter.get("/user-types", asyncHandler(getUserTypes));

// Protected route example: Get user profile
authRouter.get("/profile", isAuth, asyncHandler(getProfileController));

export default authRouter;
