import express from "express";

import isAuth from "../middlewares/isAuth.js";
import upload from "../middlewares/multer.js";
import { educationFilter } from "../middlewares/educationFilter.js";

import {
  Comments,
  deleteComment,
  deletePost,
  getAllPost,
  getFeed,
  getUserContent,
  Likes,
  Posted,
  saved
} from "../controllers/postControllers.js";


const postRoutes = express.Router();


/* ========== CREATE POST ========== */
postRoutes.post(
  "/post",
  isAuth,

  upload.fields([
    { name: "media", maxCount: 1 },
    { name: "music", maxCount: 1 }
  ]),

  educationFilter,

  Posted
);


/* ========== GET ALL POSTS ========== */
postRoutes.get(
  "/getFeed",
  isAuth,
  getFeed
);

postRoutes.get(
  "/userContent/:userId",
  isAuth,
  getUserContent
);


/* ========== LIKE POST ========== */
postRoutes.put(
  "/likes/:postId",
  isAuth,
  Likes
);


/* ========== COMMENT POST ========== */
postRoutes.post(
  "/comments/:postId",
  isAuth,
  Comments
);


/* ========== SAVE POST ========== */
postRoutes.put(
  "/saved/:postId",
  isAuth,
  saved
);


/* ========== DELETE POST ========== */
postRoutes.delete(
  "/:id",
  isAuth,
  deletePost
);


/* ========== DELETE COMMENT ========== */
postRoutes.delete(
  "/comments/:postId/:commentId",
  isAuth,
  deleteComment
);


export default postRoutes;
