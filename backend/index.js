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
import shopRouter from "./routes/shop.routes.js";
import itemRouter from "./routes/item.routes.js";
import orderRouter from "./routes/order.routes.js";
import categoryRouter from "./routes/category.routes.js";
import ratingRouter from "./routes/rating.routes.js";

// Controllers
import { autoRegenerateOtps } from "./controllers/order.controllers.js";

dotenv.config();
const app = express();

// ------------------ DATABASE ------------------
const startServer = async () => {
  try {
    await connectDb();
    console.log("✅ MongoDB connected successfully");

    // ------------------ CORS ------------------
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const defaultOrigins = [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ];

    const corsOrigins = allowedOrigins.length ? allowedOrigins : defaultOrigins;

    app.use(
      cors({
        origin: function (origin, callback) {
          if (!origin) return callback(null, true); // Postman, mobile
          if (corsOrigins.includes(origin)) return callback(null, true);
          return callback(new Error("CORS not allowed"));
        },
        credentials: true,
      })
    );

    app.options("*", cors());

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

    // ------------------ START SERVER ------------------
    if (process.env.NODE_ENV !== "lambda") {
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    }
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
};

startServer();

// Export app for Lambda
export default app;
