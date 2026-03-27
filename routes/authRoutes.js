import express from "express";
import { resetPassword, sendOtp, signIn, signOut, signUp, verifyOtp } from "../controllers/authControllers.js";

const authRoutes= express.Router()

authRoutes.post("/signup", signUp);
authRoutes.post("/signin", signIn);
authRoutes.get("/signout", signOut);
authRoutes.post("/send-otp", sendOtp);
authRoutes.post("/verify-otp", verifyOtp);
authRoutes.post("/reset-password", resetPassword);
export default authRoutes;