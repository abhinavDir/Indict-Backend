import jwt from "jsonwebtoken";

const generateToken = (userId) => {
  try {
    const token = jwt.sign(
      { userId },
      process.env.JWT_TOKEN,
      { expiresIn: "10y" }
    );
    return token;
  } catch (error) {
    throw new Error("Token generation failed");
  }
};

export default generateToken;
