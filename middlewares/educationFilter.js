import {
  extractTextFromImage
} from "../config/ocrDetector.js";

import {
  detectEducationFromVideo
} from "../config/speechEducationDetector.js";


/* Keywords for Education */
const eduWords = [
  "study", "exam", "class", "lecture", "notes", "tutorial",
  "coding", "programming", "engineering", "college",
  "school", "math", "physics", "chemistry", "biology",
  "computer", "python", "java", "react", "node", "ai", "ml",
  "assignment", "homework", "degree", "university", "learning",
  "data science", "web development", "sql", "git", "github",
  "पढ़ाई", "क्लास", "परीक्षा", "नोट्स", "लेक्चर", "शिक्षण",
  "कॉलेज", "स्कूल", "गणित", "कंप्यूटर", "कोडिंग", "विज्ञान",
  "इतिहास", "भूगोल", "शिक्षा", "अध्ययन"
];

/* Keywords to Block (Spam/Explicit/NSFW) */
const blockWords = [
  "nude", "sex", "porn", "xxx", "naked", "hot girl", "dating", "casino",
  "betting", "win money", "earn money", "crypto scam", "free followers",
  "adult", "onlyfans", "viagra", "pills", "gamble", "lottery", "cash prize",
  "free cash", "get rich", "hot babe", "sexy", "सेक्स", "गाली", "गंदा", "पोर्न"
];


/* MAIN CHECK: Safe & Educational */
const isEducation = (text = "") => {
  text = text.toLowerCase();

  // 1. Safety Check (Explicit/Spam)
  const hasBlocked = blockWords.some(w => text.includes(w));
  if (hasBlocked) return false;

  // 2. Relevance Check (Education)
  return eduWords.some(w => text.includes(w));
};


/* Clean OCR */
const cleanText = (text = "") => {

  return text
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};


/* MAIN FILTER */
export const educationFilter = async (req, res, next) => {

  try {

    const file = req.file || req.files?.media?.[0];

    if (!file) {
      return res.status(400).json({
        message: "Media required"
      });
    }


    const path = file.path;
    const type = file.mimetype;

    let allow = true;


    /* ========== IMAGE ========== */
    if (type.startsWith("image")) {

      let text =
        await extractTextFromImage(path);

      text = cleanText(text);

      console.log("OCR:", text);


      /* No text → allow */
      if (text.length < 15) {

        allow = true;
      }

      /* Has text → check */
      else {

        allow = isEducation(text);
      }
    }


    /* ========== VIDEO ========== */
    else if (type.startsWith("video")) {

      const result =
        await detectEducationFromVideo(path);


      /* API fail / silent */
      if (!result.ok || result.silent) {

        allow = true;
      }

      /* Has speech */
      else {

        allow = result.isEducation;
      }
    }


    /* ========== OTHER ========== */
    else {

      return res.status(400).json({
        message: "Invalid file type"
      });
    }


    /* ========== FINAL ========== */

    if (!allow) {
      // Differentiate why it was blocked
      let blockReason = "Only education related content allowed";

      const textToCheck = type.startsWith("image") ? await extractTextFromImage(path) : "";
      const lowerText = textToCheck.toLowerCase();

      if (blockWords.some(w => lowerText.includes(w))) {
        blockReason = "Security Violation: NSFW or Spam content is strictly prohibited";
      }

      return res.status(403).json({
        message: blockReason
      });
    }


    next();

  } catch (err) {

    console.log("Filter Error:", err.message);

    return res.status(500).json({
      message: "Verification failed"
    });
  }
};
