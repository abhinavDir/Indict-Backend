import { uploadCloud } from "../config/cloudinary.js";
import User from "../models/user.js";
// import cloudinary from "../config/cloudinary.js";
import Notification from "../models/notification.js";

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: "users" },
      (error, result) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }

        res.status(200).json({
          url: result.secure_url,
        });
      }
    );

    stream.end(req.file.buffer);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;

    const currentUser = await User.findById(userId).select("-password");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(currentUser);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const suggestedUser = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.userId }
    }).select("-password")
    return res.status(200).json(users)
  }
  catch (error) {
    return res.status(404).json({ message: `get current user${error}` })
  }
}


export const editProfile = async (req, res) => {
  try {
    const { name, username, bio, profession, gender } = req.body;

    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ FIX: ignore same user
    const sameUserWithName = await User.findOne({ username });
    if (
      sameUserWithName &&
      sameUserWithName._id.toString() !== user._id.toString()
    ) {
      return res.status(409).json({ message: "Username already exists" });
    }

    if (req.file) {
      const imageUrl = await uploadCloud(req.file.path);
      user.profileImage = imageUrl;
    }

    user.name = name;
    user.username = username;
    user.bio = bio;
    user.profession = profession;
    user.gender = gender;

    await user.save();

    return res.status(200).json(user);
  } catch (error) {
    console.error("Edit profile error:", error);
    return res.status(500).json({ message: error.message });
  }
};


export const profile = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);

  } catch (error) {
    return res.status(500).json({
      message: `Get profile error: ${error.message}`,
    });
  }
};






export const followUser = async (req, res) => {

  try {

    const userId = req.userId;        // logged in user
    const targetId = req.params.id;  // user to follow


    if (userId === targetId) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }


    const user = await User.findById(userId);
    const target = await User.findById(targetId);


    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }


    if (user.following.includes(targetId)) {
      return res.status(400).json({ message: "Already following" });
    }


    user.following.push(targetId);
    target.followers.push(userId);

    await user.save();
    await target.save();

    // ✅ CREATE FOLLOW NOTIFICATION
    await Notification.create({
      user: targetId,
      sender: userId,
      type: "follow",
      message: "started following you",
    });

    res.json({ message: "User followed" });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }
};



export const unfollowUser = async (req, res) => {

  try {

    const userId = req.userId;
    const targetId = req.params.id;


    const user = await User.findById(userId);
    const target = await User.findById(targetId);


    user.following = user.following.filter(
      (id) => id.toString() !== targetId
    );

    target.followers = target.followers.filter(
      (id) => id.toString() !== userId
    );


    await user.save();
    await target.save();


    res.json({ message: "User unfollowed" });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }
};

/* ================= GET FOLLOWERS ================= */
export const getFollowers = async (req, res) => {
  try {

    const user = await User.findById(req.params.id)
      .populate("followers", "username name profileImage");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.followers);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ================= GET FOLLOWING ================= */
export const getFollowing = async (req, res) => {
  try {

    const user = await User.findById(req.params.id)
      .populate("following", "username name profileImage");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.following);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
