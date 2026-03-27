import express from "express";

import upload from "../middlewares/multer.js";
import isAuth from "../middlewares/isAuth.js";
import { educationFilter } from "../middlewares/educationFilter.js";

import {
  deleteStory,
  getStory,
  uploadStory,
  viewStory,
  getFeedStories
} from "../controllers/storyControllers.js";


const storyRoutes = express.Router();


/* ===== UPLOAD STORY ===== */
storyRoutes.post(
  "/upload",
  isAuth,

  upload.fields([
    { name: "media", maxCount: 1 },
    { name: "music", maxCount: 1 }
  ]),

  // educationFilter,

  uploadStory
);


/* ===== GET FEED STORIES ===== */
storyRoutes.get("/feed", isAuth, getFeedStories);


/* ===== GET USER STORIES ===== */
storyRoutes.get(
  "/getALLstory/:username",
  isAuth,
  getStory
);


/* ===== VIEW STORY ===== */
storyRoutes.put(
  "/view/:storyId",
  isAuth,
  viewStory
);


/* ===== DELETE STORY ===== */
storyRoutes.delete(
  "/delete/:id",
  isAuth,
  deleteStory
);


export default storyRoutes;
