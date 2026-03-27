import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/"); // ✅ correct path
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // ✅ fixed
  },
});

const upload = multer({ storage });

export default upload;
