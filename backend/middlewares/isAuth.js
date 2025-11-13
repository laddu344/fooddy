// backend/middlewares/isAuth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config();

// Centralized auth error handler
const handleAuthError = (res, message, error = null, status = 401) => {
  if (error) console.error("[AUTH MIDDLEWARE ERROR]", message, error);
  return res.status(status).json({ message });
};

const isAuth = async (req, res, next) => {
  try {
    // 1️⃣ Get token from cookie or Authorization header
    let token = req.cookies?.token;
    if (!token && req.headers?.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) return handleAuthError(res, "Token not found");

    // 2️⃣ Verify token
    const secret = process.env.JWT_SECRET || "dev-secret";
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === "TokenExpiredError")
        return handleAuthError(res, "Token expired");
      if (err.name === "JsonWebTokenError")
        return handleAuthError(res, "Invalid token");
      return handleAuthError(res, "Authentication error", err);
    }

    // 3️⃣ Fetch user from DB
    const user = await User.findById(decoded.userId || decoded.id).select(
      "-password"
    );
    if (!user) return handleAuthError(res, "User not found", null, 404);

    // 4️⃣ Attach user to request
    req.userId = decoded.userId || decoded.id;
    req.user = user;

    next();
  } catch (error) {
    return handleAuthError(res, "Authentication error", error, 500);
  }
};

export default isAuth;
