import express from "express";
import {  getPixabayMusic } from "../controllers/musicController.js";

const musicRoutes = express.Router();

musicRoutes.get("/musics", getPixabayMusic);

export default musicRoutes;
