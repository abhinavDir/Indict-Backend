import Post from "../models/post.js";
import User from "../models/user.js";
import Loop from "../models/loop.js";
import Notification from "../models/notification.js";
import { uploadCloud, deleteCloud } from "../config/cloudinary.js";

import axios from "axios";

import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";

ffmpeg.setFfmpegPath(ffmpegPath);


/* ================= HELPERS ================= */

const safeDelete = (file) => {
  try {
    if (file && fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  } catch { }
};


const downloadMusic = async (url) => {

  const file = `public/music-${Date.now()}.mp3`;

  const res = await axios.get(url, {
    responseType: "stream"
  });

  const writer = fs.createWriteStream(file);

  res.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(file));
    writer.on("error", reject);
  });
};


const trimAudio = (input, output, start, end) => {

  return new Promise((resolve, reject) => {

    ffmpeg(input)

      .outputOptions([
        "-y",
        `-ss ${start}`,
        `-t ${end - start}`
      ])

      .output(output)

      .on("end", resolve)
      .on("error", reject)

      .run();

  });
};


const mergeVideoAudio = (video, audio, output) => {

  return new Promise((resolve, reject) => {

    ffmpeg(video)

      .input(audio)

      .outputOptions([
        "-y",

        "-map 0:v:0",
        "-map 1:a:0",

        "-c:v copy",
        "-c:a aac",

        "-shortest"
      ])

      .save(output)

      .on("end", resolve)
      .on("error", reject);

  });
};


const imageToVideo = (image, audio, output) => {

  return new Promise((resolve, reject) => {

    ffmpeg()

      .input(image)
      .inputOptions(["-loop 1"])

      .input(audio)

      .outputOptions([
        "-y",

        "-shortest",

        "-c:v libx264",
        "-pix_fmt yuv420p",

        "-c:a aac",

        "-movflags +faststart"
      ])

      .save(output)

      .on("end", resolve)
      .on("error", reject);

  });
};


/* ================= CREATE POST ================= */

export const Posted = async (req, res) => {

  try {

    if (!req.files?.media) {
      return res.status(400).json({
        message: "Media required"
      });
    }


    const mediaFile = req.files.media[0];

    const localMusic = req.files.music?.[0] || null;

    const musicUrl = req.body.musicUrl || null;

    const start = Number(req.body.musicStart || 0);
    const end = Number(req.body.musicEnd || 0);

    const caption = req.body.caption || "";
    const category = req.body.category || "education";

    let finalMedia = mediaFile.path;

    let musicFile = null;
    let trimmed = null;


    /* ===== GET MUSIC ===== */

    if (musicUrl) {
      musicFile = await downloadMusic(musicUrl);
    }
    else if (localMusic) {
      musicFile = localMusic.path;
    }


    /* ===== TRIM ===== */

    if (musicFile && end > start) {

      trimmed = `public/trim-${Date.now()}.mp3`;

      await trimAudio(
        musicFile,
        trimmed,
        start,
        end
      );

      musicFile = trimmed;
    }


    /* ===== IMAGE + MUSIC ===== */

    if (
      mediaFile.mimetype.startsWith("image") &&
      musicFile
    ) {

      const output = `public/final-${Date.now()}.mp4`;

      await imageToVideo(
        mediaFile.path,
        musicFile,
        output
      );

      finalMedia = output;
    }


    /* ===== VIDEO + MUSIC ===== */

    if (
      mediaFile.mimetype.startsWith("video") &&
      musicFile
    ) {

      const output = `public/final-${Date.now()}.mp4`;

      await mergeVideoAudio(
        mediaFile.path,
        musicFile,
        output
      );

      finalMedia = output;
    }


    /* ===== UPLOAD ===== */

    const media = await uploadCloud(finalMedia);


    const post = await Post.create({

      caption,
      category,
      media,

      mediaType: mediaFile.mimetype.startsWith("video") || musicFile ? "video" : "image",

      hasMusic: !!musicFile,

      author: req.userId
    });


    const user = await User.findById(req.userId);

    if (user) {
      user.posts.push(post._id);
      await user.save();
    }


    /* ===== CLEAN ===== */

    safeDelete(mediaFile.path);

    if (localMusic) safeDelete(localMusic.path);
    if (trimmed) safeDelete(trimmed);

    if (musicUrl && musicFile) safeDelete(musicFile);

    if (finalMedia !== mediaFile.path) {
      safeDelete(finalMedia);
    }


    const populated = await Post.findById(post._id)
      .populate("author", "username profileImage");


    res.status(201).json(populated);


  } catch (err) {

    console.log("POST ERROR:", err);

    res.status(500).json({
      message: err.message
    });

  }
};


/* ================= GET ALL POSTS ================= */

export const getAllPost = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username profileImage")
      .populate("comments.author", "username profileImage")
      .lean();

    const total = await Post.countDocuments();

    res.json({
      posts,
      total,
      page,
      hasMore: skip + limit < total
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch Posts
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author", "username profileImage")
      .populate("comments.author", "username profileImage")
      .lean();

    // Fetch Loops
    const loops = await Loop.find()
      .sort({ createdAt: -1 })
      .populate("author", "username profileImage")
      .populate("comments.author", "username profileImage")
      .lean();

    // Combine and mark types
    const combined = [
      ...posts.map(p => ({ ...p, feedType: "post" })),
      ...loops.map(l => ({ ...l, feedType: "loop" }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const paginated = combined.slice(skip, skip + limit);

    res.json({
      feed: paginated,
      hasMore: skip + limit < combined.length
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ================= LIKE ================= */

export const Likes = async (req, res) => {

  try {

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found"
      });
    }


    if (post.likes.includes(req.userId)) {
      post.likes.pull(req.userId);
    } else {
      post.likes.push(req.userId);
    }


    await post.save();

    /* ===== NOTIFICATION ===== */
    const isNowLiked = post.likes.includes(req.userId);
    if (isNowLiked && post.author.toString() !== req.userId) {
      const liker = await User.findById(req.userId).select("username");
      await Notification.create({
        user: post.author,
        sender: req.userId,
        type: "like",
        post: post._id,
        message: `${liker.username} liked your post`
      });
    }

    const updated = await Post.findById(post._id)
      .populate("author", "username profileImage")
      .populate("comments.author", "username profileImage");


    res.json(updated);


  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }
};


/* ================= COMMENT ================= */

export const Comments = async (req, res) => {

  try {

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found"
      });
    }


    post.comments.push({
      author: req.userId,
      message: req.body.message
    });


    await post.save();

    /* ===== NOTIFICATION ===== */
    if (post.author.toString() !== req.userId) {
      const commenter = await User.findById(req.userId).select("username");
      await Notification.create({
        user: post.author,
        sender: req.userId,
        type: "comment",
        post: post._id,
        message: `${commenter.username} commented: ${req.body.message.slice(0, 30)}...`
      });
    }

    const updated = await Post.findById(post._id)
      .populate("author", "username profileImage")
      .populate("comments.author", "username profileImage");


    res.json(updated);


  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }
};


/* ================= DELETE COMMENT ================= */

export const deleteComment = async (req, res) => {

  try {

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found"
      });
    }


    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found"
      });
    }


    if (comment.author.toString() !== req.userId) {
      return res.status(403).json({
        message: "Not allowed"
      });
    }


    comment.deleteOne();
    await post.save();


    res.json(post);


  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }
};


/* ================= DELETE POST ================= */

export const deletePost = async (req, res) => {

  try {

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Not found"
      });
    }


    if (post.author.toString() !== req.userId) {
      return res.status(403).json({
        message: "Unauthorized"
      });
    }


    // 1. Delete from Cloudinary
    if (post.media) {
      await deleteCloud(post.media);
    }

    // 2. Remove from User's posts array
    await User.findByIdAndUpdate(req.userId, {
      $pull: { posts: post._id }
    });

    // 3. Delete from DB
    await post.deleteOne();


    res.json({
      message: "Permanently Deleted"
    });


  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }
};


/* ================= SAVE ================= */

export const saved = async (req, res) => {

  try {

    const user = await User.findById(req.userId);

    const postId = req.params.postId;


    if (user.saved.includes(postId)) {
      user.saved.pull(postId);
    } else {
      user.saved.push(postId);
    }


    await user.save();


    res.json(user);


  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }
};


export const getUserContent = async (req, res) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate("author", "username profileImage")
      .populate("comments.author", "username profileImage")
      .lean();

    const loops = await Loop.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate("author", "username profileImage")
      .populate("comments.author", "username profileImage")
      .lean();

    res.json({
      posts: posts.map(p => ({ ...p, feedType: "post" })),
      loops: loops.map(l => ({ ...l, feedType: "loop" })),
      all: [...posts.map(p => ({ ...p, feedType: "post" })), ...loops.map(l => ({ ...l, feedType: "loop" }))].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
