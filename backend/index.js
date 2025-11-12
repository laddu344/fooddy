import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import superadminRouter from "./routes/superadmin.routes.js";
import itemRouter from "./routes/item.routes.js";
import shopRouter from "./routes/shop.routes.js";
import orderRouter from "./routes/order.routes.js";
import categoryRouter from "./routes/category.routes.js";
import ratingRouter from "./routes/rating.routes.js";
import cron from "node-cron";
import { autoRegenerateOtps } from "./controllers/order.controllers.js";

const app = express();

// ✅ Connect to MongoDB (only once)
connectDb();

// ------------------ CORS SETUP ------------------
const envAllowed = (
  process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || ""
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const defaultAllowed = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5180",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5180",

  // ✅ API Gateway URL
  "https://zzs6141xjh.execute-api.us-east-1.amazonaws.com/dev",

  // ✅ S3 Frontend hosting URL
  "http://foody-backend-lambda-dev-serverlessdeploymentbucke-qoqvzstuy6zz.s3-website-us-east-1.amazonaws.com",
];

const allowedOrigins = envAllowed.length ? envAllowed : defaultAllowed;

const isLocalDev = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow Postman/mobile apps
      if (allowedOrigins.includes(origin) || isLocalDev(origin)) {
        return callback(null, true);
      }
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

// ------------------ LOCAL DEV MODE ------------------
if (process.env.NODE_ENV !== "lambda") {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`🚀 Server started locally at port ${port}`);
  });
}

// ✅ Export app for AWS Lambda handler
export default app;
