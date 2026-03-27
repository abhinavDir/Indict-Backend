import express from "express";
import {
  editProfile,
  getCurrentUser,
  suggestedUser,
  profile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing, // 👈 make sure this exists in controller
} from "../controllers/userControllers.js";
import isAuth from "../middlewares/isAuth.js";
import upload from "../middlewares/multer.js";

const UserRoutes = express.Router();

// Get current logged-in user
UserRoutes.get("/me", isAuth, getCurrentUser);

// Suggested users
UserRoutes.get("/suggestedUser", isAuth, suggestedUser);

// Edit profile (with image upload)
UserRoutes.post(
  "/editProfile",
  isAuth,
  upload.single("profileImage"), // ✅ FIXED
  editProfile
);

// Get user profile by username
UserRoutes.get("/getProfile/:username", isAuth, profile); // ✅ FIXED


UserRoutes.put("/follow/:id", isAuth, followUser);
UserRoutes.put("/unfollow/:id", isAuth, unfollowUser);
UserRoutes.get("/followers/:id", isAuth, getFollowers);
UserRoutes.get("/following/:id", isAuth, getFollowing);
export default UserRoutes;
