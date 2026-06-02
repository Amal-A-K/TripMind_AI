/**
 * Auth Middleware — JWT Verification
 *
 * Protects routes by verifying the Bearer token from the
 * Authorization header. Attaches the authenticated user object
 * to req.user for downstream controllers.
 */

import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Expect: "Authorization: Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const error = new Error("Not authorized — no token provided");
    error.statusCode = 401;
    return next(error);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB (exclude password from the result)
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      const error = new Error("Not authorized — user not found");
      error.statusCode = 401;
      return next(error);
    }

    next();
  } catch (err) {
    const error = new Error("Not authorized — invalid or expired token");
    error.statusCode = 401;
    next(error);
  }
};

export default protect;
