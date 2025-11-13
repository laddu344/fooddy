import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import cron from "node-cron";

// Import routers
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import superadminRouter from "./routes/superadmin.routes.js";
import itemRouter from "./routes/item.routes.js";
import shopRouter from "./routes/shop.routes.js";
import orderRouter from "./routes/order.routes.js";
import categoryRouter from "./routes/category.routes.js";
import ratingRouter from "./routes/rating.routes.js";

// Import controllers
import { autoRegenerateOtps } from "./controllers/order.controllers.js";

// Import socket handler
import { socketHandler } from "./socket.js";

dotenv.config();
const app = express();
const server = http.createServer(app);

// ------------------ CORS SETUP ------------------
const envAllowed = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
const defaultAllowed = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5180",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5180",
];

const allowedOrigins = envAllowed.length ? envAllowed : defaultAllowed;

const isLocalDev = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow Postman or mobile requests
    if (allowedOrigins.includes(origin) || isLocalDev(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

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

// ------------------ SOCKET.IO ------------------
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"]
  }
});
app.set("io", io);
app.use((req, res, next) => {
  req.io = io;
  next();
});
socketHandler(io);

// ------------------ CRON JOB ------------------
cron.schedule("0 */2 * * *", () => {
  console.log("⏰ Running automatic OTP regeneration...");
  autoRegenerateOtps();
});

// ------------------ GLOBAL ERROR HANDLER ------------------
app.use((err, req, res, next) => {
  console.error("Global error:", err.message || err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

// ------------------ SERVER START ------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  try {
    await connectDb();
    console.log(`🚀 Server running on port ${PORT}`);
  } catch (err) {
    console.error("❌ Server startup failed:", err.message);
  }
});

export default app;
