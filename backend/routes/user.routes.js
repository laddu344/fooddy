import express from "express";
import isAuth from "../middlewares/isAuth.js";
import asyncHandler from "../middlewares/asyncHandler.js"; // default import
import { getCurrentUser, updateUserLocation, updateActiveStatus } from "../controllers/user.controllers.js";

const userRouter = express.Router();

// Use asyncHandler to catch errors from async controllers
userRouter.get("/current", isAuth, asyncHandler(getCurrentUser));
userRouter.post("/update-location", isAuth, asyncHandler(updateUserLocation));
userRouter.put("/set-active", isAuth, asyncHandler(updateActiveStatus));

export default userRouter;
