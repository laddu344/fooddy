import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import cron from "node-cron";

// Routers
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import superadminRouter from "./routes/superadmin.routes.js";
import itemRouter from "./routes/item.routes.js";
import shopRouter from "./routes/shop.routes.js";
import orderRouter from "./routes/order.routes.js";
import categoryRouter from "./routes/category.routes.js";
import ratingRouter from "./routes/rating.routes.js";

// Controllers
import { autoRegenerateOtps } from "./controllers/order.controllers.js";

dotenv.config();
const app = express();

// 🟢 Connect to MongoDB FIRST (improves startup speed & reliability)
const startServer = async () => {
  try {
    await connectDb(); // Wait until DB is ready before starting server
    console.log("✅ MongoDB connected successfully");

    // ------------------ CORS SETUP ------------------
    const envAllowed = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const defaultAllowed = [
      // Local dev
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5180",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "http://127.0.0.1:5175",
      "http://127.0.0.1:5180",

      // API Gateway
      "https://9264vk6u1k.execute-api.us-east-1.amazonaws.com/dev",

      // S3 Frontend
      "http://foody-backend-lambda-dev-serverlessdeploymentbucke-qoqvzstuy6zz.s3-website-us-east-1.amazonaws.com",
    ];

    const allowedOrigins = envAllowed.length ? envAllowed : defaultAllowed;

    const isLocalDev = (origin) =>
      /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

    app.use(
      cors({
        origin: function (origin, callback) {
          if (!origin) return callback(null, true); // allow Postman, mobile apps
          if (allowedOrigins.includes(origin) || isLocalDev(origin)) {
            return callback(null, true);
          }
          return callback(new Error("CORS not allowed"));
        },
        credentials: true,
      })
    );

    app.options("*", cors()); // preflight requests

    // ------------------ MIDDLEWARES ------------------
    app.use(express.json());
    app.use(cookieParser());

    // ------------------ ROUTES ------------------
    app.use("/api/auth", authRouter);
    app.use("/api/user", userRouter);
    app.use("/api/superadmin", superadminRouter);
    app.use("/api/shop", shopRouter);
    app.use("/api/item", itemRouter);
    app.use("/api/order", orderRouter);
    app.use("/api/categories", categoryRouter);
    app.use("/api/rating", ratingRouter);

    // ------------------ CRON JOBS ------------------
    cron.schedule("0 */2 * * *", () => {
      console.log("⏰ Running automatic OTP regeneration...");
      autoRegenerateOtps();
    });

    // ------------------ GLOBAL ERROR HANDLER ------------------
    app.use((err, req, res, next) => {
      console.error("Global error:", err);
      res.status(500).json({ message: err.message || "Internal server error" });
    });

    // ------------------ START SERVER (Local only) ------------------
    if (process.env.NODE_ENV !== "lambda") {
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`🚀 Server running locally on port ${PORT}`);
      });
    }
  } catch (err) {
    console.error("❌ Server startup failed:", err.message);
    process.exit(1);
  }
};

// 🟢 Start everything
startServer();

// ✅ Export app for AWS Lambda
export default app;
