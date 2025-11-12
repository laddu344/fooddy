import express from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { signUp, signIn, signOut, sendOtp, verifyOtp, resetPassword, googleAuth } from "../controllers/auth.controllers.js";
import { getUserTypes } from "../controllers/superadmin.controllers.js";

const authRouter = express.Router();

// Wrap all async controllers with asyncHandler for proper error handling
authRouter.post("/signup", asyncHandler(signUp));
authRouter.post("/signin", asyncHandler(signIn));
authRouter.get("/signout", asyncHandler(signOut));
authRouter.post("/send-otp", asyncHandler(sendOtp));
authRouter.post("/verify-otp", asyncHandler(verifyOtp));
authRouter.post("/reset-password", asyncHandler(resetPassword));
authRouter.post("/google-auth", asyncHandler(googleAuth));

// Public endpoint for user types (needed for signup)
authRouter.get("/user-types", asyncHandler(getUserTypes));

export default authRouter;
