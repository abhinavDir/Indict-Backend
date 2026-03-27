import mongoose from "mongoose";

const loopSchema = new mongoose.Schema({

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  mediaType: {
    type: String,                 // FIXED
    enum: ["image", "video"],
    required: true
  },

  media: {
    type: String,                 // FIXED
    required: true
  },

  caption: {
    type: String
  },

  likes: [                        // FIXED
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  comments: [                     // FIXED
    {
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      message: String
    }
  ]

}, { timestamps: true });

loopSchema.index({ author: 1 });
loopSchema.index({ createdAt: -1 });

const Loop = mongoose.model("Loop", loopSchema);

export default Loop;
