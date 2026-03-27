import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import OpenAI from "openai";

ffmpeg.setFfmpegPath(ffmpegPath);


/* OpenAI Client */
let openai = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}


/* Keywords */
const eduWords = [
  "study","exam","class","lecture","notes","tutorial",
  "coding","programming","engineering","college",
  "school","math","physics","chemistry","biology",
  "computer","python","java","react","node","ai","ml",

  "पढ़ाई","क्लास","परीक्षा","नोट्स","लेक्चर",
  "कॉलेज","स्कूल","गणित","कंप्यूटर","कोडिंग"
];


/* Check */
const isEducation = (text = "") => {

  text = text.toLowerCase();

  return eduWords.some(w => text.includes(w));
};


/* Extract Audio */
const extractAudio = (video, out) => {

  return new Promise((resolve, reject) => {

    ffmpeg(video)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .format("wav")
      .save(out)
      .on("end", resolve)
      .on("error", reject);

  });
};


/* MAIN */
export const detectEducationFromVideo = async (videoPath) => {

  let audioFile = "";

  try {

    /* ===============================
       IF NO API KEY → SKIP CHECK
    =============================== */

    if (!openai) {

      console.log("Whisper skipped: No API Key");

      return {
        ok: true,
        silent: false,
        isEducation: true
      };
    }


    audioFile = `temp-${Date.now()}.wav`;


    /* Convert */
    await extractAudio(videoPath, audioFile);


    /* Silent check */
    const stats = fs.statSync(audioFile);

    if (stats.size < 4000) {

      fs.unlinkSync(audioFile);

      console.log("Silent video");

      return {
        ok: true,
        silent: true,
        isEducation: true
      };
    }


    /* ===============================
       WHISPER API
    =============================== */

    const result =
      await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFile),
        model: "whisper-1"
      });


    const text = result?.text || "";

    console.log("Speech:", text);

    fs.unlinkSync(audioFile);


    if (!text.trim()) {

      return {
        ok: true,
        silent: true,
        isEducation: true
      };
    }


    return {
      ok: true,
      silent: false,
      isEducation: isEducation(text)
    };

  } catch (err) {

    console.log("Speech Error:", err.message);


    /* ===============================
       IMPORTANT FIX FOR 429
    =============================== */

    if (
      err?.status === 429 ||
      err?.message?.includes("quota") ||
      err?.message?.includes("limit")
    ) {

      console.log("Quota finished → skipping speech check");

      return {
        ok: true,
        silent: false,
        isEducation: true
      };
    }


    /* Delete temp */
    if (audioFile && fs.existsSync(audioFile)) {
      fs.unlinkSync(audioFile);
    }


    /* Fallback: NEVER BLOCK */
    return {
      ok: false,
      silent: false,
      isEducation: true
    };
  }
};
