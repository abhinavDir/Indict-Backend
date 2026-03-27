import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  type: {
    type: String,
    enum: ["follow", "like", "comment"],
    required: true
  },

  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    default: null
  },

  message: {
    type: String
  },

  isRead: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

export default mongoose.model("Notification", notificationSchema);
