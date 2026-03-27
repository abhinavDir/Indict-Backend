import express from "express";

import isAuth from "../middlewares/isAuth.js";
import upload from "../middlewares/multer.js";
import { educationFilter } from "../middlewares/educationFilter.js";

import {
  getAllLoop,
  LoopComments,
  loopLikes,
  PostedLoop,
  deleteLoop
} from "../controllers/loopControllers.js";

const loopRoutes = express.Router();

/* ===== LIKE LOOP ===== */
loopRoutes.put(
  "/posted-likes/:loopId",
  isAuth,
  loopLikes
);

/* ===== COMMENT LOOP ===== */
loopRoutes.post(
  "/loop-comments/:loopId",
  isAuth,
  LoopComments
);

/* ===== GET ALL LOOPS ===== */
loopRoutes.get(
  "/getALLloop",
  isAuth,
  getAllLoop
);

/* ===== CREATE LOOP ===== */
loopRoutes.post(
  "/posted-loop",
  isAuth,
  upload.single("media"),
  educationFilter,
  PostedLoop
);

/* ===== DELETE LOOP ===== */
loopRoutes.delete(
  "/:id",
  isAuth,
  deleteLoop
);

export default loopRoutes;
