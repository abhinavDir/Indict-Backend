import Tesseract from "tesseract.js";

export const extractTextFromImage = async (imagePath) => {

  try {

    const result = await Tesseract.recognize(
      imagePath,
      "eng+hin",
      { logger: () => {} }
    );

    return result?.data?.text || "";

  } catch (err) {

    console.log("OCR Error:", err.message);

    return "";
  }
};
