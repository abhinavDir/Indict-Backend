import { uploadCloud, deleteCloud } from "../config/cloudinary.js";
import Story from "../models/story.js";
import User from "../models/user.js";
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
  } catch (e) {
    console.log("Delete error:", e.message);
  }
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


/* ================= UPLOAD STORY ================= */

export const uploadStory = async (req, res) => {

  try {

    if (!req.files?.media) {
      return res.status(400).json({
        message: "Story media required"
      });
    }


    const mediaFile = req.files.media[0];

    const localMusic = req.files.music?.[0] || null;

    const musicUrl = req.body.musicUrl || null;

    const start = Number(req.body.musicStart || 0);
    const end = Number(req.body.musicEnd || 0);


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


    /* ===== MERGE ===== */

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

    const mediaUrl = await uploadCloud(finalMedia);


    const story = await Story.create({

      author: req.userId,

      mediaType: mediaFile.mimetype.startsWith("video")
        ? "video"
        : "image",

      media: mediaUrl,

      hasMusic: !!musicFile
    });


    /* ===== CLEAN ===== */

    safeDelete(mediaFile.path);

    if (localMusic) safeDelete(localMusic.path);
    if (trimmed) safeDelete(trimmed);

    if (musicUrl && musicFile) safeDelete(musicFile);

    if (finalMedia !== mediaFile.path) {
      safeDelete(finalMedia);
    }


    const populated = await Story.findById(story._id)
      .populate("author", "username profileImage");


    res.status(201).json(populated);


  } catch (err) {

    console.log("STORY ERROR:", err);

    res.status(500).json({
      message: "Upload failed"
    });

  }
};

/* ================= VIEW STORY ================= */

export const viewStory = async (req, res) => {

  try {

    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({
        message: "Story not found"
      });
    }


    if (!story.viewers.includes(req.userId)) {

      story.viewers.push(req.userId);
      await story.save();
    }


    const populated = await Story.findById(story._id)
      .populate("author", "name username profileImage")
      .populate("viewers", "name username profileImage");


    res.json(populated);


  } catch (err) {

    res.status(500).json({
      message: "View failed"
    });

  }
};


/* ================= GET STORY ================= */

export const getStory = async (req, res) => {

  try {

    const user = await User.findOne({
      username: req.params.username
    });


    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    const stories = await Story.find({
      author: user._id
    })
      .populate("author", "name username profileImage")
      .sort({ createdAt: -1 });


    res.json(stories);


  } catch (err) {

    res.status(500).json({
      message: "Get failed"
    });

  }
};


/* ================= DELETE STORY ================= */

export const deleteStory = async (req, res) => {

  try {

    const story = await Story.findById(req.params.id);


    if (!story) {
      return res.status(404).json({
        message: "Not found"
      });
    }


    if (story.author.toString() !== req.userId) {
      return res.status(403).json({
        message: "Unauthorized"
      });
    }


    // 1. Delete Media from Cloudinary
    if (story.media) {
      await deleteCloud(story.media);
    }

    // 2. Delete from DB
    await story.deleteOne();


    res.json({
      message: "Permanently Deleted"
    });


  } catch (err) {

    res.status(500).json({
      message: "Delete failed"
    });

  }
};

/* ================= GET FEED STORIES (GLOBAL) ================= */

export const getFeedStories = async (req, res) => {
  try {
    const stories = await Story.find()
      .populate("author", "username profileImage")
      .sort({ createdAt: -1 });

    const grouped = stories.reduce((acc, story) => {
      const authorId = story.author?._id?.toString();
      if (authorId && !acc[authorId]) {
        acc[authorId] = {
          author: story.author,
          stories: []
        };
      }
      if (authorId) {
        acc[authorId].stories.push(story);
      }
      return acc;
    }, {});

    res.json(Object.values(grouped));

  } catch (err) {
    res.status(500).json({ message: "Feed stories failed" });
  }
};
