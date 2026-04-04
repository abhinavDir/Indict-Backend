import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import path from "path";

import connectDb from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import loopRoutes from "./routes/loopRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import musicRoutes from "./routes/musicRoutes.js";
import blogRoutes from "./routes/blogRoutes.js"; // ✅ ADD BLOG
import dns from "node:dns/promises"; 
dns.setServers(["1.1.1.1", "1.0.0.1"]);
dotenv.config();

const app = express();
const port = process.env.PORT || 7000;


// ================= DATABASE =================

connectDb();
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT ERROR:", err);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED PROMISE:", err);
});



// ================= MIDDLEWARE =================

app.use(cors({
  origin: "https://indict-frontend.vercel.app",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());


// ================= STATIC FILES =================
// ✅ VERY IMPORTANT (For Blog Images)

app.use("/public", express.static("public"));


// ================= ROUTES =================

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/loop", loopRoutes);
app.use("/api/story", storyRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/music", musicRoutes);

app.use("/api/blog", blogRoutes);


// ================= SERVER =================

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
