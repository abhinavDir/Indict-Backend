import express from "express";

import {
  createBlog,
  getBlogs,
  getSingleBlog,
  deleteBlog,
  likeBlog,
  commentBlog,
  getFeed,
} from "../controllers/blogController.js";

import isAuth from "../middlewares/isAuth.js";
import upload from "../middlewares/multer.js";

const blogRoutes = express.Router();


/* ================= FEED FIRST ================= */

blogRoutes.get("/feed", getFeed);   // ✅ MUST BE ON TOP


/* ================= BLOG CRUD ================= */

blogRoutes.post(
  "/blog-add",
  isAuth,
  upload.single("image"),
  createBlog
);

blogRoutes.get("/blog", getBlogs);

blogRoutes.post("/like/:blogId", isAuth, likeBlog);

blogRoutes.post("/comment/:blogId", isAuth, commentBlog);

blogRoutes.delete("/:id", isAuth, deleteBlog);


/* ================= SINGLE BLOG (LAST) ================= */

blogRoutes.get("/:id", getSingleBlog);   // ✅ ALWAYS LAST


export default blogRoutes;
