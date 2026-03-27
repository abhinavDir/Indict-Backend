import { uploadCloud, deleteCloud } from "../config/cloudinary.js";
import Loop from "../models/loop.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";


export const PostedLoop = async (req, res) => {

    try {
        const { caption } = req.body;
        let media;

        if (req.file) {
            media = await uploadCloud(req.file.path);
        } else {
            return res.status(400).json({ message: "media is required" });
        }

        const loop = await Loop.create({
            caption,
            media,
            mediaType: req.file.mimetype.startsWith("video") ? "video" : "image",
            author: req.userId
        });

        const user = await User.findById(req.userId);

        if (user) {
            user.loops = user.loops || [];
            user.loops.push(loop._id);
            await user.save();
        }

        const populateLoop = await Loop.findById(loop._id).populate("author", "name username profileImage");
        return res.status(201).json(populateLoop);

    } catch (error) {
        console.log("LOOP UPLOAD ERROR:", error);
        return res.status(500).json({ message: `upload post is ${error.message}` });
    }
};


export const loopLikes = async (req, res) => {
    try {
        const loopId = req.params.loopId
        const loop = await Loop.findById(loopId)
        if (!loop) {
            return res.status(400).json({ message: "likes not found" })

        }
        const alreadyLiked = loop.likes.some(id => id.toString() === req.userId.toString())

        if (alreadyLiked) {
            loop.likes = loop.likes.filter(id => id.toString() !== req.userId.toString())
        } else {

            loop.likes.push(req.userId)
        }
        await loop.save();

        /* ===== NOTIFICATION ===== */
        if (loop.likes.includes(req.userId) && loop.author.toString() !== req.userId) {
            const liker = await User.findById(req.userId).select("username");
            await Notification.create({
                user: loop.author,
                sender: req.userId,
                type: "like",
                message: `${liker.username} liked your reel`
            });
        }

        const populated = await Loop.findById(loop._id)
            .populate("author", "name username profileImage");

        return res.status(200).json(populated);
    }
    catch (error) {
        return res.status(404).json({ message: `likes post is ${error}` })

    }
}



export const getAllLoop = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const loops = await Loop.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("author", "name username profileImage")
            .populate("comments.author", "name username profileImage")
            .lean();

        const total = await Loop.countDocuments();

        return res.status(200).json({
            loops,
            total,
            page,
            hasMore: skip + limit < total
        });

    }
    catch (error) {
        console.log("GET ALL LOOP ERROR:", error);
        return res.status(500).json({ message: `getAll loop error: ${error.message}` });
    }
}


export const LoopComments = async (req, res) => {

    try {
        const { message } = req.body
        const loopId = req.params.loopId
        const loop = await Loop.findById(loopId)

        if (!loop) {
            return res.status(400).json({ message: "comments not found" })

        }
        loop.comments.push({ author: req.userId, message })
        await loop.save();

        /* ===== NOTIFICATION ===== */
        if (loop.author.toString() !== req.userId) {
            const commenter = await User.findById(req.userId).select("username");
            await Notification.create({
                user: loop.author,
                sender: req.userId,
                type: "comment",
                message: `${commenter.username} commented on your reel: ${message.slice(0, 30)}...`
            });
        }

        loop.populate("author", "name username profileImage")
            .populate("comments.author", "name username profileImage");
        return res.status(200).json(loopId)


    }
    catch (error) {
        return res.status(404).json({ message: ` comments loop post is ${error}` })

    }
}

export const deleteLoop = async (req, res) => {
    try {
        const loop = await Loop.findById(req.params.id);

        if (!loop) {
            return res.status(404).json({ message: "Reel not found" });
        }

        if (loop.author.toString() !== req.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // 1. Delete from Cloudinary
        if (loop.media) {
            await deleteCloud(loop.media);
        }

        // 2. Remove reference from User
        await User.findByIdAndUpdate(req.userId, {
            $pull: { loops: loop._id }
        });

        // 3. Delete from DB
        await loop.deleteOne();

        res.json({ message: "Reel Permanently Deleted" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
