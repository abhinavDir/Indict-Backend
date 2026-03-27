import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export const uploadCloud = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result.secure_url;
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};
export const deleteCloud = async (url) => {
  try {
    if (!url) return;

    // Extract public_id from URL
    const parts = url.split("/");
    const fileName = parts[parts.length - 1];
    const publicId = fileName.split(".")[0];

    // Detect type from extension or URL
    const isVideo = url.includes(".mp4") || url.includes(".mov");

    await cloudinary.uploader.destroy(publicId, {
      resource_type: isVideo ? "video" : "image"
    });

  } catch (error) {
    console.log("Cloudinary Delete Error:", error.message);
  }
};
