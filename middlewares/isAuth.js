import jwt from "jsonwebtoken";

const isAuth = (req, res, next) => {
  try {

    // Get token from cookies or Authorization header
   const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
    // Check token exists
    if (!token) {
      return res.status(401).json({
        message: "Token not found",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_TOKEN);

    // Save user id in request
    req.userId = decoded.userId;

    // Continue
    next();

  } catch (error) {

    return res.status(401).json({
      message: "Invalid or expired token",
    });

  }
};

export default isAuth;