import express from "express";
import isAuth from "../middlewares/isAuth.js";

import {
  getNotifications,
  markAsRead
} from "../controllers/notificationController.js";

const notificationRoutes = express.Router();


notificationRoutes.get("/getNotification", isAuth, getNotifications);

notificationRoutes.put("/read", isAuth, markAsRead);


export default notificationRoutes;
