import Blog from "../models/blog.js";
import User from "../models/user.js";
import { uploadCloud } from "../config/cloudinary.js";
import fs from "fs";
import { getAllExternalBlogs } from "../config/externalApis.js";

// import {
//   getMediumBlogs,
//   getDevBlogs,
//   getHashnodeBlogs
// } from "../config/externalApis.js";

/* ================= SAFE DELETE ================= */

const safeDelete = (file) => {
  try {
    if (file && fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  } catch { }
};


/* ================= CREATE BLOG ================= */

export const createBlog = async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        message: "Image required",
      });
    }

    const { title, description, category } = req.body;

    const localFile = req.file.path;

    const image = await uploadCloud(localFile);

    const blog = await Blog.create({
      title,
      description,
      category,
      image,
      author: req.userId,
    });

    const user = await User.findById(req.userId);

    if (user) {
      user.blogs = user.blogs || [];
      user.blogs.push(blog._id);
      await user.save();
    }

    safeDelete(localFile);

    const populated = await Blog.findById(blog._id)
      .populate("author", "username profileImage");

    return res.status(201).json(populated);

  } catch (err) {

    console.log("BLOG ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};


/* ================= GET ALL BLOGS ================= */

export const getBlogs = async (req, res) => {

  try {

    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .populate("author", "username profileImage")
      .populate("comments.author", "username profileImage");

    return res.status(200).json(blogs);

  } catch (err) {

    console.log("GET BLOGS ERROR:", err);

    return res.status(500).json({ message: err.message });
  }
};


/* ================= GET SINGLE ================= */

export const getSingleBlog = async (req, res) => {

  try {

    const blog = await Blog.findById(req.params.id)
      .populate("author", "username profileImage")
      .populate("comments.author", "username profileImage");

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    return res.json(blog);

  } catch (err) {

    console.log("GET SINGLE ERROR:", err);

    return res.status(500).json({ message: err.message });
  }
};


/* ================= LIKE ================= */

export const likeBlog = async (req, res) => {

  try {

    const blog = await Blog.findById(req.params.blogId);

    if (!blog) {
      return res.status(404).json({
        message: "Not found",
      });
    }

    if (blog.likes.includes(req.userId)) {
      blog.likes.pull(req.userId);
    } else {
      blog.likes.push(req.userId);
    }

    await blog.save();

    const updated = await Blog.findById(blog._id)
      .populate("author", "username profileImage");

    return res.json(updated);

  } catch (err) {

    console.log("LIKE ERROR:", err);

    return res.status(500).json({ message: err.message });
  }
};


/* ================= COMMENT ================= */

export const commentBlog = async (req, res) => {

  try {

    const blog = await Blog.findById(req.params.blogId);

    if (!blog) {
      return res.status(404).json({
        message: "Not found",
      });
    }

    blog.comments.push({
      author: req.userId,
      message: req.body.message,
    });

    await blog.save();

    const updated = await Blog.findById(blog._id)
      .populate("author", "username profileImage")
      .populate("comments.author", "username profileImage");

    return res.json(updated);

  } catch (err) {

    console.log("COMMENT ERROR:", err);

    return res.status(500).json({ message: err.message });
  }
};


/* ================= DELETE ================= */

export const deleteBlog = async (req, res) => {

  try {

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        message: "Not found",
      });
    }

    if (blog.author.toString() !== req.userId) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    await blog.deleteOne();

    return res.json({
      message: "Deleted",
    });

  } catch (err) {

    console.log("DELETE ERROR:", err);

    return res.status(500).json({ message: err.message });
  }
};


/* ================= FEED ================= */

/* ================= FEED ================= */


let externalCache = [];
let lastFetchTime = 0;

const CACHE_TIME = 1000 * 60 * 30; // 30 minutes

/* ================= HELPERS ================= */

const normalize = (b) => ({
  ...b,

  likes: b.likes || [],
  comments: b.comments || [],

  createdAt: b.createdAt
    ? new Date(b.createdAt)
    : new Date(),
});

/* ================= GET FEED ================= */

export const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const cat = req.query.category || null;

    const skip = (page - 1) * limit;

    /* ===== INTERNAL (user) BLOGS — always ALL of them ===== */

    const internal = await Blog.find()
      .sort({ createdAt: -1 })
      .populate("author", "username profileImage")
      .lean();

    /* ===== EXTERNAL BLOGS (cached + refreshed) ===== */

    const now = Date.now();

    if (!externalCache.length || now - lastFetchTime > CACHE_TIME) {
      console.log("🔄 Refreshing external blogs...");
      externalCache = await getAllExternalBlogs();
      lastFetchTime = now;
    }

    /* ===== NORMALIZE ===== */

    const normalizedInternal = internal.map(normalize);
    const normalizedExternal = externalCache.map(normalize);

    /* ===== MERGE ALL BLOGS ===== */

    const allRaw = [...normalizedInternal, ...normalizedExternal];

    /* ===== DEDUPLICATE BY TITLE & FILTER LANGUAGE ===== */

    const uniqueMap = new Map();
    const hindiRegex = /[\u0900-\u097F]/; // Matches Hindi characters

    allRaw.forEach(blog => {
      if (!blog.title) return;

      const cleanTitle = blog.title.toLowerCase().trim().replace(/[^\w\s\u0900-\u097F]/g, "");

      // 1. Not Repeat: Deduplicate by cleaned title
      if (!uniqueMap.has(cleanTitle)) {

        // 2. Only Hindi and English:
        // We check if it contains Hindi chars OR if it's primarily standard ASCII (English)
        // We discard scripts like Cyrillic, Arabic, Chinese etc.
        const hasHindi = hindiRegex.test(blog.title) || hindiRegex.test(blog.description);
        const isEnglish = /^[ -~]*$/.test(blog.title.replace(/[^\x00-\x7F]/g, ""));

        if (hasHindi || isEnglish) {
          uniqueMap.set(cleanTitle, blog);
        }
      }
    });

    let all = Array.from(uniqueMap.values());

    /* ===== SEARCH & CATEGORY FILTER ===== */
    const filterKey = (cat && cat.toLowerCase() !== "latest") ? cat.toLowerCase() : null;

    if (filterKey) {
      all = all.filter(blog => {
        const bCat = (blog.category || "").toLowerCase();
        const bTitle = (blog.title || "").toLowerCase();
        const bDesc = (blog.description || "").toLowerCase();

        return (
          bCat === filterKey ||
          bTitle.includes(filterKey) ||
          bDesc.includes(filterKey)
        );
      });
    }

    /* ===== SHUFFLE THE ENTIRE FEED (User + API) ===== */
    /* This makes every refresh completely random and mixed */

    all.sort(() => Math.random() - 0.5);

    /* ===== PAGINATE ===== */

    const paginated = all.slice(skip, skip + limit);

    return res.status(200).json({
      page,
      limit,
      total: all.length,
      hasMore: skip + limit < all.length,
      blogs: paginated,
    });

  } catch (err) {
    console.log("FEED ERROR:", err);
    return res.status(500).json({ error: "Feed failed", blogs: [] });
  }
};