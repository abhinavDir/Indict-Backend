import User from "../models/user.js";
import bcrypt from "bcryptjs";
import generateToken from "../config/token.js";
import { SendMail } from "../config/Mail.js";

/* ================= SIGN UP ================= */
export const signUp = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body missing" });
    }

    let { name, username, email, password } = req.body;

    // ✅ SAFETY CHECK (REQUIRED)
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // normalize
    username = username.trim().toLowerCase();
    email = email.trim().toLowerCase();

    // email check
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // username check
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // password validation
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const newUser = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
    });

    // generate token
    const token = generateToken(newUser._id);

    // set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // true in production
      sameSite: "none",
      maxAge: 10 * 365 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "Signup successful",
      userId: newUser._id,
        token // 🔥 ADD THIS

    });
  } catch (error) {
    // console.error(error);
    return res.status(500).json({ message: "Signup server error" });
  }
};

/* ================= SIGN IN ================= */
export const signIn = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body missing" });
    }

    let { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    username = username.trim().toLowerCase();

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
  httpOnly: true,
  secure: true,        // ✅ REQUIRED
  sameSite: "none",    // ✅ REQUIRED
  maxAge: 10 * 365 * 24 * 60 * 60 * 1000,
});

    return res.status(200).json({
      message: "Signin successful",
      userId: user._id,
        token // 🔥 ADD THIS

    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Signin server error" });
  }
};

/* ================= SIGN OUT ================= */
export const signOut = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "Signout successful" });
  } catch (error) {
    return res.status(500).json({ message: "Signout error" });
  }
};

/* ================= SEND OTP ================= */
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({ message: "Email is wrong" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    user.resetOtp = otp;
    user.OtpExpires = Date.now() + 5 * 60 * 1000;
    user.isOtpVerified = false;

    await user.save();
    await SendMail(user.email, otp);

    return res.status(200).json({ message: "Email successfully sent" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Send OTP error" });
  }
};

/* ================= VERIFY OTP ================= */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (
      !user ||
      user.resetOtp !== otp.toString() ||
      user.OtpExpires < Date.now()
    ) {
      return res.status(404).json({ message: "OTP is not valid" });
    }

    user.isOtpVerified = true;
    user.resetOtp = undefined;
    user.OtpExpires = undefined;

    await user.save();

    return res.status(200).json({ message: "OTP is verified" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Verify OTP error" });
  }
};

/* ================= RESET PASSWORD ================= */
export const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user || !user.isOtpVerified) {
      return res.status(404).json({
        message: "OTP verification is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.isOtpVerified = false;

    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Reset password error" });
  }
};
