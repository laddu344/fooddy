import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../utils/token.js";
import { sendOtpMail } from "../utils/mail.js";

// Utility to return consistent error responses
const handleError = (res, message, error = null, status = 500) => {
  if (error) console.error('[AUTH ERROR]', message, error);
  return res.status(status).json({ message });
};

export const signUp = async (req, res) => {
  try {
    const { fullName, email, password, mobile, role, userType } = req.body;
    let user = await User.findOne({ email });
    if (user) return handleError(res, "User already exists.", null, 400);
    if (password.length < 6) return handleError(res, "Password must be at least 6 characters.", null, 400);
    if (mobile.length < 10) return handleError(res, "Mobile number must be at least 10 digits.", null, 400);

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = { fullName, email, role, mobile, password: hashedPassword };

    if (role === "user" && userType) {
      userData.userType = userType;
      const UserType = (await import("../models/userType.model.js")).default;
      const userTypeDoc = await UserType.findOne({ name: userType });
      if (userTypeDoc) userData.deliveryAllowed = userTypeDoc.deliveryAllowed;
    }

    user = await User.create(userData);

    if (role === "owner" || role === "deliveryBoy") {
      return res.status(201).json({
        message: "Account created. Pending superadmin approval.",
        pendingApproval: true
      });
    }

    const token = await genToken(user);
    res.cookie("token", token, {
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true
    });

    return res.status(201).json(user);

  } catch (error) {
    return handleError(res, "Sign up failed.", error);
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return handleError(res, "User does not exist.", null, 400);
    if (!user.password) return handleError(res, "This account uses Google Sign-In. Use Google login or reset password.", null, 400);
    if ((user.role === "deliveryBoy" || user.role === "owner") && !user.isApproved)
      return handleError(res, "Account pending approval from superadmin.", null, 403);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return handleError(res, "Incorrect password.", null, 400);

    const token = await genToken(user);
    res.cookie("token", token, {
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true
    });

    return res.status(200).json(user);

  } catch (error) {
    return handleError(res, "Sign in failed.", error);
  }
};

export const signOut = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    return handleError(res, "Sign out failed.", error);
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return handleError(res, "Email is required.", null, 400);

    const user = await User.findOne({ email });
    if (!user) return handleError(res, "User does not exist.", null, 400);

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.resetOtp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    user.isOtpVerified = false;
    await user.save();

    console.log(`[AUTH] Generated OTP for ${email}: ${otp}`);

    try {
      await sendOtpMail(email, otp);
      console.log(`[AUTH] OTP email sent to ${email}`);
      return res.status(200).json({ message: "OTP sent successfully to your email." });
    } catch (emailError) {
      console.error(`[AUTH] OTP email failed for ${email}`, emailError);
      return res.status(200).json({
        message: "OTP generated. Email delivery may be delayed.",
        warning: "Check spam folder or try again."
      });
    }
  } catch (error) {
    return handleError(res, "Send OTP failed.", error);
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.resetOtp !== otp || user.otpExpires < Date.now())
      return handleError(res, "Invalid or expired OTP.", null, 400);

    user.isOtpVerified = true;
    user.resetOtp = undefined;
    user.otpExpires = undefined;
    await user.save();
    return res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    return handleError(res, "Verify OTP failed.", error);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.isOtpVerified) return handleError(res, "OTP verification required.", null, 400);

    user.password = await bcrypt.hash(newPassword, 10);
    user.isOtpVerified = false;
    await user.save();
    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    return handleError(res, "Reset password failed.", error);
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { fullName, email, role, mobile, userType } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      const token = await genToken(user);
      res.cookie("token", token, {
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
      });
      return res.status(200).json(user);
    }

    const userData = { fullName, email, role, mobile };
    if (role === "user" && userType) {
      userData.userType = userType;
      const UserType = (await import("../models/userType.model.js")).default;
      const userTypeDoc = await UserType.findOne({ name: userType });
      if (userTypeDoc) userData.deliveryAllowed = userTypeDoc.deliveryAllowed;
    }

    user = await User.create(userData);
    if (role === "owner" || role === "deliveryBoy") {
      return res.status(201).json({ message: "Account created. Pending superadmin approval.", pendingApproval: true });
    }

    const token = await genToken(user);
    res.cookie("token", token, {
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true
    });
    return res.status(201).json(user);

  } catch (error) {
    return handleError(res, "Google auth failed.", error);
  }
};
