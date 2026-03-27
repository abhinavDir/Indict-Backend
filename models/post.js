import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  mediaType: {
    type: String,
    enum: ["image", "video"],
    required: true
  },
  category: {
    type: String,
    default: "education"
  },

  media: {
    type: String,
    required: true
  },

  caption: String,

  // ✅ SIMPLE MUSIC URL
  music: {
    type: String
  },

  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  comments: [{

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    message: String

  }]

}, { timestamps: true });

PostSchema.index({ author: 1 });
PostSchema.index({ createdAt: -1 });


const Post = mongoose.model("Post", PostSchema);

export default Post;
